// Mock district list standing in for a real geo lookup (browser
// geolocation reverse-lookup, or an IMD/census district registry) until
// that's wired up in a later phase. ~15 sample Telangana/AP districts.
export const DISTRICTS = [
  'Hyderabad',
  'Rangareddy',
  'Medchal-Malkajgiri',
  'Warangal',
  'Karimnagar',
  'Nizamabad',
  'Khammam',
  'Nalgonda',
  'Mahbubnagar',
  'Adilabad',
  'Visakhapatnam',
  'Vijayawada (NTR)',
  'Guntur',
  'Krishna',
  'Chittoor',
]

export const DEFAULT_DISTRICT = DISTRICTS[0]

// Which state each sample district is in — used only for the Home
// dashboard's "District, State" location line. The 5 coastal/southern
// districts are Andhra Pradesh; the rest are Telangana.
const AP_DISTRICTS = new Set(['Visakhapatnam', 'Vijayawada (NTR)', 'Guntur', 'Krishna', 'Chittoor'])

export function stateForDistrict(district) {
  return AP_DISTRICTS.has(district) ? 'Andhra Pradesh' : 'Telangana'
}

// Which sample districts actually touch the coast — a strict subset of
// AP_DISTRICTS above (Chittoor is AP but inland, so it's excluded here).
// Used to gate fisherman-role advice: sea/coastal guidance only makes
// sense for someone actually near the coast, not every AP district.
const COASTAL_DISTRICTS = new Set(['Visakhapatnam', 'Vijayawada (NTR)', 'Guntur', 'Krishna'])

export function isCoastalDistrict(district) {
  return COASTAL_DISTRICTS.has(district)
}
