// Mirrors backend/districts.py exactly (same names, same approximate
// coordinates) — the frontend needs these too, to center the map,
// without round-tripping to the backend just to find out where a
// district is.
export const DISTRICT_COORDINATES = {
  Hyderabad: [17.385, 78.4867],
  Rangareddy: [17.3213, 78.3947],
  'Medchal-Malkajgiri': [17.6294, 78.4813],
  Warangal: [17.9784, 79.5941],
  Karimnagar: [18.4386, 79.1288],
  Nizamabad: [18.6725, 78.0941],
  Khammam: [17.2473, 80.1514],
  Nalgonda: [17.0575, 79.269],
  Mahbubnagar: [16.7488, 77.9855],
  Adilabad: [19.6641, 78.532],
  Visakhapatnam: [17.6868, 83.2185],
  'Vijayawada (NTR)': [16.5062, 80.648],
  Guntur: [16.3067, 80.4365],
  Krishna: [16.1667, 81.1333],
  Chittoor: [13.2172, 79.1003],
}
