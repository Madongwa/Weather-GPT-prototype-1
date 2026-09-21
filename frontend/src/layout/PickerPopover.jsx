import './PickerPopover.css'

/**
 * A small dropdown list of string options, anchored under whichever pill
 * opened it. Shared by all three status-strip pills (role, district,
 * language) since they're otherwise identical UI — only the option list
 * and the change handler differ.
 */
function PickerPopover({ options, value, onSelect, onClose }) {
  return (
    <>
      {/* Invisible full-screen button: clicking anywhere outside the
          popover closes it, without needing a document-level listener. */}
      <button type="button" className="picker-popover__backdrop" aria-label="Close" onClick={onClose} />

      <div className="picker-popover" role="listbox">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="option"
            aria-selected={option === value}
            className={`picker-popover__option ${
              option === value ? 'picker-popover__option--selected' : ''
            }`}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </>
  )
}

export default PickerPopover
