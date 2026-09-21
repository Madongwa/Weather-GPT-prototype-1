// Mock conversation history — stands in for real chat history until the
// backend actually stores past turns. Deliberately includes one
// `grounded: false` entry so the "Unverified" (amber) state is visible
// too, not just the happy path. Lives in src/data (not screens/Ask) since
// AskContext (shared by Home and Ask) seeds its conversation state from
// this, not just the Ask screen.
export const SAMPLE_CONVERSATION = [
  {
    id: 'sample-1',
    question: 'Is there a cyclone warning?',
    answer: 'No active cyclone warning for your district right now.',
    grounded: true,
    sourceLabel: 'IMD + Open-Meteo · 40 min ago',
  },
  {
    id: 'sample-2',
    question: 'Should I harvest today?',
    answer: 'Storm likely by 2 PM — hold off on harvesting until tomorrow.',
    grounded: true,
    sourceLabel: 'IMD + Open-Meteo · 12 min ago',
  },
  {
    id: 'sample-3',
    question: 'Is it safe to drive?',
    answer: 'Roads are clear so far, but visibility may drop after 2 PM.',
    grounded: false,
    sourceLabel: 'Sources conflict · 12 min ago',
  },
]
