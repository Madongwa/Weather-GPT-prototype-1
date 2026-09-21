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
