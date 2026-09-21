"""
Geofencing — point-in-polygon warning-zone checks and distance-to-hazard,
using real math running on real (if simplified) district boundaries.

The polygons here are NOT survey-accurate district boundaries — sourcing
a real GIS shapefile is out of scope for this project — they're small
rectangles centered on each district's coordinate from districts.py,
sized to roughly approximate the district's extent. The point-in-polygon
and haversine-distance algorithms themselves are the real thing; only
the input geometry is a stand-in. Trust & Sources labels this LIVE for
exactly that reason: the computation is real, the geometry feeding it
is a placeholder.
"""

import math

from fastapi import APIRouter, HTTPException, Query

from districts import DISTRICT_COORDINATES

router = APIRouter(prefix="/geofence", tags=["geofence"])

# Roughly half a degree per side (~55km) around the district's center.
_HALF_EXTENT_DEGREES = 0.5


def _district_polygon(district: str) -> list[tuple[float, float]] | None:
    coordinates = DISTRICT_COORDINATES.get(district)
    if coordinates is None:
        return None
    lat, lon = coordinates
    return [
        (lat - _HALF_EXTENT_DEGREES, lon - _HALF_EXTENT_DEGREES),
        (lat - _HALF_EXTENT_DEGREES, lon + _HALF_EXTENT_DEGREES),
        (lat + _HALF_EXTENT_DEGREES, lon + _HALF_EXTENT_DEGREES),
        (lat + _HALF_EXTENT_DEGREES, lon - _HALF_EXTENT_DEGREES),
    ]


def point_in_polygon(lat: float, lon: float, polygon: list[tuple[float, float]]) -> bool:
    """Standard ray-casting point-in-polygon test."""
    inside = False
    n = len(polygon)
    j = n - 1
    for i in range(n):
        lat_i, lon_i = polygon[i]
        lat_j, lon_j = polygon[j]
        intersects = ((lon_i > lon) != (lon_j > lon)) and (
            lat < (lat_j - lat_i) * (lon - lon_i) / (lon_j - lon_i) + lat_i
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points, in kilometers."""
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/check")
def check(
    latitude: float = Query(...),
    longitude: float = Query(...),
    district: str = Query(...),
):
    polygon = _district_polygon(district)
    coordinates = DISTRICT_COORDINATES.get(district)
    if polygon is None or coordinates is None:
        raise HTTPException(status_code=404, detail=f"No boundary configured for district '{district}'")

    district_lat, district_lon = coordinates
    return {
        "district": district,
        "in_zone": point_in_polygon(latitude, longitude, polygon),
        "distance_km": round(haversine_km(latitude, longitude, district_lat, district_lon), 1),
    }
