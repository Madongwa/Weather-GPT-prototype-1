import { describe, expect, it } from 'vitest'
import { stepsForRole, topDoAndAvoid } from './adviceRules'

describe('stepsForRole', () => {
  it('returns the rain-hold-off step for a Farmer when it is raining', () => {
    const steps = stepsForRole('Farmer', { precipitation_mm: 2, temperature_c: 28 }, { district: 'Hyderabad' })
    expect(steps.map((s) => s.id)).toContain('farmer-rain-harvest')
  })

  it('falls back to the general "no active hazards" step for a role with no matching conditional rule', () => {
    const steps = stepsForRole('Researcher', { precipitation_mm: 0, temperature_c: 25 }, { district: 'Hyderabad' })
    expect(steps.map((s) => s.id)).toEqual(['general-clear'])
  })

  it('does not apply another role\'s rules', () => {
    const steps = stepsForRole('Student', { precipitation_mm: 5, temperature_c: 39 }, { district: 'Hyderabad' })
    expect(steps.map((s) => s.id)).not.toContain('farmer-heat')
  })

  describe('coastal-aware fisherman advice', () => {
    it('shows the no-coastal-access step for a Fisherman in a landlocked district', () => {
      const steps = stepsForRole('Fisherman', { wind_speed_kmh: 40 }, { district: 'Hyderabad' })
      expect(steps.map((s) => s.id)).toContain('fisherman-no-coast')
      expect(steps.map((s) => s.id)).not.toContain('fisherman-wind')
    })

    it('shows the strong-wind sea warning for a Fisherman in a coastal district with high wind', () => {
      const steps = stepsForRole('Fisherman', { wind_speed_kmh: 40 }, { district: 'Visakhapatnam' })
      expect(steps.map((s) => s.id)).toContain('fisherman-wind')
      expect(steps.map((s) => s.id)).not.toContain('fisherman-no-coast')
    })

    it('shows neither fisherman DO step in a coastal district with calm wind', () => {
      const steps = stepsForRole('Fisherman', { wind_speed_kmh: 5 }, { district: 'Visakhapatnam' })
      expect(steps.map((s) => s.id)).not.toContain('fisherman-wind')
      expect(steps.map((s) => s.id)).not.toContain('fisherman-no-coast')
    })

    it('treats an AP-but-inland district (Chittoor) as non-coastal', () => {
      const steps = stepsForRole('Fisherman', { wind_speed_kmh: 40 }, { district: 'Chittoor' })
      expect(steps.map((s) => s.id)).toContain('fisherman-no-coast')
    })
  })
})

describe('topDoAndAvoid', () => {
  it('returns undefined doStep/avoidStep when nothing matches the role', () => {
    // No role in this app has zero AVOID_RULES matches, but doStep can
    // legitimately be undefined before falling through to "general-clear"
    // if a future role has no matching rule at all — guard against find()
    // silently returning something wrong instead of undefined.
    const { doStep } = topDoAndAvoid('Not A Real Role', null, { district: 'Hyderabad' })
    expect(doStep).toBeUndefined()
  })

  it('picks a coastal-appropriate avoid step for a Fisherman', () => {
    const inland = topDoAndAvoid('Fisherman', null, { district: 'Hyderabad' })
    expect(inland.avoidStep.id).toBe('avoid-fisherman-no-coast')

    const coastal = topDoAndAvoid('Fisherman', null, { district: 'Guntur' })
    expect(coastal.avoidStep.id).toBe('avoid-fisherman')
  })
})
