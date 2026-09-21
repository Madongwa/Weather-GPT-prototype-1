import { isCoastalDistrict } from '../constants/districts'

// Data-driven rules: { id, type, roleTags, predicate(weather, context), stepText }.
// `roleTags` includes '*' for "applies to every role". `predicate`
// receives the normalized weather object from useWeather (or null when
// unavailable) plus a small `context` object (currently just
// `{ district }`) and decides whether this rule is relevant right now.
// Keeping rules as data (not scattered if/else in a component) is what
// makes it easy to swap in a real deterministic rules engine later
// without touching either screen that reads this file.
//
// Lives in src/data (not screens/MyAdvice) because it's shared by two
// screens: the full My Advice screen (every matching DO rule, numbered)
// and the Home dashboard's "Advice for your work" teaser (just the top
// DO and top AVOID for the selected role).
export const ADVICE_RULES = [
  {
    id: 'farmer-rain-harvest',
    type: 'do',
    roleTags: ['Farmer'],
    predicate: (w) => Boolean(w && w.precipitation_mm > 0),
    stepText: 'Rain is active or expected — hold off on harvesting until conditions clear.',
  },
  {
    id: 'farmer-heat',
    type: 'do',
    roleTags: ['Farmer', 'Outdoor worker'],
    predicate: (w) => Boolean(w && w.temperature_c >= 38),
    stepText: 'High heat — schedule fieldwork for early morning or evening, and keep workers hydrated.',
  },
  {
    id: 'driver-visibility',
    type: 'do',
    roleTags: ['Driver', 'Commuter'],
    predicate: (w) => Boolean(w && /rain|storm|fog/i.test(w.condition)),
    stepText: 'Reduced-visibility conditions — drive with headlights on and increase following distance.',
  },
  {
    id: 'fisherman-wind',
    type: 'do',
    roleTags: ['Fisherman'],
    predicate: (w, ctx) => Boolean(isCoastalDistrict(ctx?.district) && w && w.wind_speed_kmh >= 30),
    stepText: 'Strong winds — avoid going out to sea until conditions ease.',
  },
  {
    id: 'fisherman-no-coast',
    type: 'do',
    roleTags: ['Fisherman'],
    predicate: (_w, ctx) => Boolean(ctx?.district) && !isCoastalDistrict(ctx.district),
    stepText: 'This district has no coastal access — sea-condition advice will show for a coastal district instead.',
  },
  {
    id: 'outdoor-worker-storm',
    type: 'do',
    roleTags: ['Outdoor worker', 'Farmer'],
    predicate: (w) => Boolean(w && /thunderstorm/i.test(w.condition)),
    stepText: 'Thunderstorm activity nearby — move to indoor shelter and avoid open fields.',
  },
  {
    id: 'student-school',
    type: 'do',
    roleTags: ['Student'],
    predicate: (w) => Boolean(w && /thunderstorm|heavy rain|cyclone/i.test(w.condition)),
    stepText: 'Severe weather nearby — check with your school or college for closure or delay announcements.',
  },
  {
    id: 'office-worker-commute',
    type: 'do',
    roleTags: ['Office worker', 'Commuter'],
    predicate: (w) => Boolean(w && w.precipitation_mm > 5),
    stepText: 'Heavier rain expected — leave extra time for your commute today.',
  },
  {
    id: 'emergency-official-monitor',
    type: 'do',
    roleTags: ['Emergency official'],
    predicate: () => true,
    stepText: 'Monitor the Alerts & Field Reports screen for incoming SOS requests and community reports.',
  },
  {
    id: 'general-clear',
    type: 'do',
    roleTags: ['General citizen', 'Researcher', 'Student', 'Office worker'],
    predicate: (w) => !w || w.precipitation_mm === 0,
    stepText: 'No active hazards detected right now — a good time to check that your emergency kit is ready.',
  },
]

// A second, smaller rule set for the "AVOID THIS" side of Home's teaser
// card. Kept deliberately simple (role-only, not weather-conditional)
// rather than trying to mirror every DO rule with a matching AVOID —
// these are steady, always-applicable cautions per role, not reactions
// to a specific forecast.
export const AVOID_RULES = [
  {
    id: 'avoid-farmer',
    type: 'avoid',
    roleTags: ['Farmer'],
    predicate: () => true,
    stepText: 'Avoid spraying pesticide or fertilizer right before expected rain — it washes off unused.',
  },
  {
    id: 'avoid-driver',
    type: 'avoid',
    roleTags: ['Driver', 'Commuter'],
    predicate: () => true,
    stepText: 'Avoid sudden braking on wet roads — stopping distance roughly doubles.',
  },
  {
    id: 'avoid-fisherman',
    type: 'avoid',
    roleTags: ['Fisherman'],
    predicate: (_w, ctx) => isCoastalDistrict(ctx?.district),
    stepText: 'Avoid going out to sea when wind speeds exceed 30 km/h.',
  },
  {
    id: 'avoid-fisherman-no-coast',
    type: 'avoid',
    roleTags: ['Fisherman'],
    predicate: (_w, ctx) => Boolean(ctx?.district) && !isCoastalDistrict(ctx.district),
    stepText: 'Avoid relying on this advice for sea conditions — this district has no coastline.',
  },
  {
    id: 'avoid-outdoor-worker',
    type: 'avoid',
    roleTags: ['Outdoor worker'],
    predicate: () => true,
    stepText: 'Avoid prolonged sun exposure during peak afternoon heat.',
  },
  {
    id: 'avoid-student',
    type: 'avoid',
    roleTags: ['Student'],
    predicate: () => true,
    stepText: 'Avoid walking home during an active thunderstorm warning — wait it out indoors.',
  },
  {
    id: 'avoid-office-worker',
    type: 'avoid',
    roleTags: ['Office worker', 'Researcher'],
    predicate: () => true,
    stepText: 'Avoid scheduling an outdoor commute during forecast peak-rain hours.',
  },
  {
    id: 'avoid-emergency-official',
    type: 'avoid',
    roleTags: ['Emergency official'],
    predicate: () => true,
    stepText: "Avoid acting on a single report — cross-check People's Reports against official alerts first.",
  },
  {
    id: 'avoid-general',
    type: 'avoid',
    roleTags: ['General citizen'],
    predicate: () => true,
    stepText: 'Avoid ignoring official warnings even if conditions look calm right now.',
  },
]

function matches(rule, role, weather, context) {
  return (rule.roleTags.includes('*') || rule.roleTags.includes(role)) && rule.predicate(weather, context)
}

/** Every DO step that currently applies — used by the full My Advice screen. */
export function stepsForRole(role, weather, context) {
  return ADVICE_RULES.filter((rule) => matches(rule, role, weather, context))
}

/**
 * Just the top DO and top AVOID for a role — used by Home's compact
 * teaser card. Falls back to the first AVOID_RULES entry with '*' or a
 * matching tag even if none of its (always-true) predicates could ever
 * fail, since AVOID_RULES has no weather-conditional entries today.
 */
export function topDoAndAvoid(role, weather, context) {
  const doStep = ADVICE_RULES.find((rule) => matches(rule, role, weather, context))
  const avoidStep = AVOID_RULES.find((rule) => matches(rule, role, weather, context))
  return { doStep, avoidStep }
}
