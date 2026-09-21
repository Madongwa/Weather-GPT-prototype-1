// Fallback shown only if the backend can't be reached — mirrors the
// shape /alerts returns for real. See AlertsScreen.jsx's fetch/catch.
export const SAMPLE_ALERTS = [
  {
    id: 'sample-1',
    hazard_type: 'Heavy rain',
    severity: 'Be prepared',
    status: 'Live',
    description:
      'Sustained heavy rainfall expected through the evening, with localized flooding risk in low-lying areas.',
    district: null,
    is_simulated: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    hazard_type: 'Heat wave',
    severity: 'Be careful',
    status: 'Issued',
    description: 'Daytime temperatures forecast well above seasonal norms for the next 3 days.',
    district: null,
    is_simulated: true,
    created_at: new Date().toISOString(),
  },
]
