import { describe, expect, it } from 'vitest'
import { validateAnswer } from './answerValidator'

const fallbackContext = { weatherSummary: 'Overcast, 28°C, 0mm precipitation', district: 'Hyderabad' }

describe('validateAnswer', () => {
  it('passes through a normal, coherent answer unchanged', () => {
    const answer = 'It is not currently raining in Hyderabad.'
    expect(validateAnswer(answer, 'Overcast, 28°C', fallbackContext)).toBe(answer)
  })

  it('falls back to a plain grounded sentence on a repetition loop', () => {
    const answer = 'the the the the the the the the the the the the'
    const result = validateAnswer(answer, 'Overcast, 28°C', fallbackContext)
    expect(result).toBe('Current conditions in Hyderabad: Overcast, 28°C, 0mm precipitation.')
  })

  it('falls back to a plain grounded sentence on symbol-noise word salad', () => {
    const answer = "5? and Memecripts and Ref. of# deal-include>/ Generally (include#')(')(#'w's, l')"
    const result = validateAnswer(answer, 'Overcast, 28°C', fallbackContext)
    expect(result).toBe('Current conditions in Hyderabad: Overcast, 28°C, 0mm precipitation.')
  })

  it('falls back to a no-data message when weatherSummary is unavailable', () => {
    const result = validateAnswer('the the the the the the', '', { weatherSummary: null, district: 'Hyderabad' })
    expect(result).toBe("Live weather data isn't available right now for Hyderabad.")
  })

  it('still appends the severity-hallucination caveat on a coherent-but-unsupported claim', () => {
    const answer = 'A red alert has been issued for your district.'
    const result = validateAnswer(answer, 'Overcast, 28°C, light wind', fallbackContext)
    expect(result).toContain(answer)
    expect(result).toContain('not found in the current data')
  })
})
