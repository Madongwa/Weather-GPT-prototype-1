import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n' // ListenButton uses useTranslation() — needs i18next initialized once, same as main.jsx does for the real app.
import { AppSettingsProvider } from '../../context/AppSettingsContext'
import ChatTurn from './ChatTurn'

// ListenButton (rendered inside ChatTurn) calls useAppSettings() for the
// speech locale, so every render needs a real AppSettingsProvider above it.
function renderChatTurn(props) {
  return render(
    <AppSettingsProvider>
      <ChatTurn {...props} />
    </AppSettingsProvider>,
  )
}

describe('ChatTurn', () => {
  it('renders the question and answer text', () => {
    renderChatTurn({
      question: 'Is there a cyclone warning?',
      answer: 'No active cyclone warning for your district right now.',
      grounded: true,
      sourceLabel: 'IMD + Open-Meteo · live',
    })

    expect(screen.getByText('Is there a cyclone warning?')).toBeInTheDocument()
    expect(screen.getByText('No active cyclone warning for your district right now.')).toBeInTheDocument()
  })

  it('renders a "Based on:" source list when sources are present', () => {
    renderChatTurn({
      question: 'Is there a cyclone warning?',
      answer: 'No active cyclone warning.',
      grounded: true,
      sourceLabel: 'IMD + Open-Meteo · live',
      sources: [{ title: 'IMD Sub-Divisionwise Warning', url: 'https://mausam.imd.gov.in/warning', content: '...' }],
    })

    expect(screen.getByText('Based on:')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'IMD Sub-Divisionwise Warning' })
    expect(link).toHaveAttribute('href', 'https://mausam.imd.gov.in/warning')
  })

  it('renders no source list when sources is empty or missing', () => {
    renderChatTurn({ question: 'Will it rain?', answer: 'Not right now.', grounded: false, sourceLabel: 'Unreachable' })

    expect(screen.queryByText('Based on:')).not.toBeInTheDocument()
  })
})
