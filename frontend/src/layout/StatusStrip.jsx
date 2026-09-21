import { useState } from 'react'
import { useAppSettings } from '../context/AppSettingsContext'
import { ROLES } from '../constants/roles'
import { DISTRICTS } from '../constants/districts'
import { LANGUAGES } from '../constants/languages'
import PickerPopover from './PickerPopover'
import './StatusStrip.css'

/**
 * Three tappable pills — role, district, language — each opening a
 * picker for its own list. Rendered by AppShell on every screen except
 * Home, which owns an equivalent (richer) set of pills in its own
 * HomeHeader instead — see AppShell.jsx for why the two never both
 * render at once.
 *
 * Only one picker can be open at a time, tracked as a single piece of
 * local state (`openPicker`) rather than three separate booleans —
 * simpler, and it's impossible for two pickers to be open together.
 */
function StatusStrip() {
  const { role, setRole, district, setDistrict, language, setLanguage } = useAppSettings()
  const [openPicker, setOpenPicker] = useState(null)

  const togglePicker = (name) => setOpenPicker((prev) => (prev === name ? null : name))

  return (
    <div className="status-strip">
      <div className="status-strip__pill-wrap">
        <button type="button" className="status-strip__pill" onClick={() => togglePicker('role')}>
          {role}
        </button>
        {openPicker === 'role' && (
          <PickerPopover
            options={ROLES}
            value={role}
            onSelect={(value) => {
              setRole(value)
              setOpenPicker(null)
            }}
            onClose={() => setOpenPicker(null)}
          />
        )}
      </div>

      <div className="status-strip__pill-wrap">
        <button type="button" className="status-strip__pill" onClick={() => togglePicker('district')}>
          {district}
        </button>
        {openPicker === 'district' && (
          <PickerPopover
            options={DISTRICTS}
            value={district}
            onSelect={(value) => {
              setDistrict(value)
              setOpenPicker(null)
            }}
            onClose={() => setOpenPicker(null)}
          />
        )}
      </div>

      <div className="status-strip__pill-wrap">
        <button type="button" className="status-strip__pill" onClick={() => togglePicker('language')}>
          {language}
        </button>
        {openPicker === 'language' && (
          <PickerPopover
            options={LANGUAGES}
            value={language}
            onSelect={(value) => {
              setLanguage(value)
              setOpenPicker(null)
            }}
            onClose={() => setOpenPicker(null)}
          />
        )}
      </div>
    </div>
  )
}

export default StatusStrip
