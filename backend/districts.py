"""
Sample district -> coordinates lookup.

Mirrors the district list in frontend/src/constants/districts.js exactly
(same names, same order) so a district picked in the UI can be looked up
here without any name-matching guesswork. Coordinates are approximate
(district headquarters / major city), which is fine for weather lookups —
Open-Meteo's forecast resolution doesn't need pinpoint accuracy.
"""

DISTRICT_COORDINATES: dict[str, tuple[float, float]] = {
    "Hyderabad": (17.3850, 78.4867),
    "Rangareddy": (17.3213, 78.3947),
    "Medchal-Malkajgiri": (17.6294, 78.4813),
    "Warangal": (17.9784, 79.5941),
    "Karimnagar": (18.4386, 79.1288),
    "Nizamabad": (18.6725, 78.0941),
    "Khammam": (17.2473, 80.1514),
    "Nalgonda": (17.0575, 79.2690),
    "Mahbubnagar": (16.7488, 77.9855),
    "Adilabad": (19.6641, 78.5320),
    "Visakhapatnam": (17.6868, 83.2185),
    "Vijayawada (NTR)": (16.5062, 80.6480),
    "Guntur": (16.3067, 80.4365),
    "Krishna": (16.1667, 81.1333),
    "Chittoor": (13.2172, 79.1003),
}
