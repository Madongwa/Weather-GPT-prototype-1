import { DISTRICT_COORDINATES } from '../constants/districtCoordinates'

/**
 * Finds the closest of the 15 sample districts to a given coordinate.
 * Plain squared-distance on lat/lon (not haversine) — at this scale
 * (picking the nearest of 15 points a few hundred km apart, all within
 * one country), the distortion from treating degrees as flat is
 * negligible, so it's not worth a trig-heavy calculation just to find
 * "which of these 15 is closest."
 */
export function findNearestDistrict(latitude, longitude) {
  let nearest = null
  let nearestDistanceSq = Infinity

  for (const [district, [lat, lon]] of Object.entries(DISTRICT_COORDINATES)) {
    const distanceSq = (lat - latitude) ** 2 + (lon - longitude) ** 2
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq
      nearest = district
    }
  }

  return nearest
}
