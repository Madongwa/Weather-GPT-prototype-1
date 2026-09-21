// The three Demo Mode states. Every screen that shows data should check
// this (via useAppSettings().demoMode) and label itself accordingly —
// it's the mechanism that keeps the app honest about what's real vs.
// illustrative during judging.
export const DEMO_MODE_OPTIONS = [
  {
    value: 'demo',
    label: 'Demo',
    description: 'All mock data. Scenario simulators enabled.',
  },
  {
    value: 'imd-only',
    label: 'IMD-only',
    description: 'Only the real Open-Meteo adapter is live — everything else is mocked.',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Whatever is actually wired up live is live; the rest is mocked.',
  },
]

export const DEFAULT_DEMO_MODE = 'demo'
