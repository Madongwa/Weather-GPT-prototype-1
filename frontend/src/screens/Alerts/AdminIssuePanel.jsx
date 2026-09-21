import { useState } from 'react'
import { adminLogin } from '../../api/admin'
import { issueAlert } from '../../api/alerts'
import './AdminIssuePanel.css'

const SESSION_KEY = 'weathergpt.adminToken'
const SEVERITIES = ['Be aware', 'Be prepared', 'Be careful']

/**
 * Only rendered when role === 'Emergency official' (see AlertsScreen).
 * This is the app's one real admin capability, gated by the password
 * check in backend/auth.py — a genuine trust boundary, not just a
 * role-based UI hide, since the backend independently rejects the
 * request without a valid token.
 */
function AdminIssuePanel({ district, onIssued }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY))
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [hazardType, setHazardType] = useState('')
  const [severity, setSeverity] = useState(SEVERITIES[0])
  const [description, setDescription] = useState('')
  const [issueError, setIssueError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    try {
      const data = await adminLogin(password)
      sessionStorage.setItem(SESSION_KEY, data.token)
      setToken(data.token)
    } catch {
      setLoginError('Incorrect password.')
    }
  }

  const handleIssue = async (event) => {
    event.preventDefault()
    setIssueError('')
    try {
      await issueAlert({ hazard_type: hazardType, severity, description, district }, token)
      setHazardType('')
      setDescription('')
      onIssued?.()
    } catch {
      setIssueError('Could not issue the alert — your admin session may have expired.')
    }
  }

  if (!token) {
    return (
      <form className="admin-issue-panel" onSubmit={handleLogin}>
        <p className="admin-issue-panel__title">Emergency official sign-in</p>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" className="admin-issue-panel__submit">
          Sign in
        </button>
        {loginError && <p className="admin-issue-panel__error">{loginError}</p>}
      </form>
    )
  }

  return (
    <form className="admin-issue-panel" onSubmit={handleIssue}>
      <p className="admin-issue-panel__title">Issue an official alert for {district}</p>
      <input
        type="text"
        placeholder="Hazard type (e.g. Flood)"
        value={hazardType}
        onChange={(event) => setHazardType(event.target.value)}
        required
      />
      <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
        {SEVERITIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        required
      />
      <button type="submit" className="admin-issue-panel__submit">
        Issue alert
      </button>
      {issueError && <p className="admin-issue-panel__error">{issueError}</p>}
    </form>
  )
}

export default AdminIssuePanel
