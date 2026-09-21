import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n' // ListenButton uses useTranslation() — needs i18next initialized once, same as main.jsx does for the real app.
import ChatTurn from './ChatTurn'

describe('ChatTurn', () => {
  it('renders the question and answer text', () => {
    render(
      <ChatTurn
        question="Is there a cyclone warning?"
        answer="No active cyclone warning for your district right now."
        grounded
        sourceLabel="IMD + Open-Meteo · live"
      />,
    )

    expect(screen.getByText('Is there a cyclone warning?')).toBeInTheDocument()
    expect(screen.getByText('No active cyclone warning for your district right now.')).toBeInTheDocument()
  })

  it('renders a "Based on:" source list when sources are present', () => {
    render(
      <ChatTurn
        question="Is there a cyclone warning?"
        answer="No active cyclone warning."
        grounded
        sourceLabel="IMD + Open-Meteo · live"
        sources={[{ title: 'IMD Sub-Divisionwise Warning', url: 'https://mausam.imd.gov.in/warning', content: '...' }]}
      />,
    )

    expect(screen.getByText('Based on:')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'IMD Sub-Divisionwise Warning' })
    expect(link).toHaveAttribute('href', 'https://mausam.imd.gov.in/warning')
  })

  it('renders no source list when sources is empty or missing', () => {
    render(<ChatTurn question="Will it rain?" answer="Not right now." grounded={false} sourceLabel="Unreachable" />)

    expect(screen.queryByText('Based on:')).not.toBeInTheDocument()
  })
})
