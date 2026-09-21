import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import './HazardMap.css'

// Without this reset, react-leaflet's default marker icon silently
// fails to load — a known Leaflet + bundler issue where the default
// icon URLs are relative paths that don't survive bundling. Importing
// the images directly and re-pointing L.Icon.Default at Vite's
// bundled URLs fixes it.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

/**
 * Shared map view: district center, an optional approximate warning-
 * zone circle (matches geofence.py's simplified boundary, not a real
 * GIS shape), and pins for alerts/SOS/reports. Uses OpenStreetMap
 * tiles, which — unlike Google Maps or Mapbox — need no API key.
 */
function HazardMap({ center, zoom = 10, radiusKm, markers = [], height = 260 }) {
  return (
    <div className="hazard-map" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radiusKm && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#14b8a6', fillOpacity: 0.08 }}
          />
        )}
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lon]}>
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default HazardMap
