import { describe, expect, it } from 'vitest'
import { parseUtcDate } from './parseUtcDate'

describe('parseUtcDate', () => {
  it('treats a naive SQLite timestamp as UTC (no double-offset)', () => {
    const parsed = parseUtcDate('2026-09-21 13:10:51')
    expect(parsed.toISOString()).toBe('2026-09-21T13:10:51.000Z')
  })

  it('does not append a second Z to an already-ISO timestamp', () => {
    // Regression test for the exact bug caught during the light-theme
    // audit: sample/mock data already has a trailing Z (from
    // toISOString()), and blindly appending another one produced an
    // Invalid Date that rendered as "NaNh ago".
    const parsed = parseUtcDate('2026-09-21T13:10:51.000Z')
    expect(parsed.toISOString()).toBe('2026-09-21T13:10:51.000Z')
    expect(Number.isNaN(parsed.getTime())).toBe(false)
  })

  it('handles a timestamp with an explicit numeric offset', () => {
    const parsed = parseUtcDate('2026-09-21T18:40:51+05:30')
    expect(parsed.toISOString()).toBe('2026-09-21T13:10:51.000Z')
  })
})
