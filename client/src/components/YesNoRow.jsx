function YesNoRow({ label, name, value, details, detailsLabel, onChange, showDetailsWhen = 'Yes' }) {
  return (
    <div className="yesno-row">
      <div className="yesno-row__question">
        <span className="field-label">{label}</span>
        <div className="radio-group" role="radiogroup" aria-label={label}>
          <label className="radio-option">
            <input
              type="radio"
              name={name}
              value="Yes"
              checked={value === 'Yes'}
              onChange={() => onChange('value', 'Yes')}
            />
            Yes
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name={name}
              value="No"
              checked={value === 'No'}
              onChange={() => onChange('value', 'No')}
            />
            No
          </label>
        </div>
      </div>
      {value === showDetailsWhen ? (
        <div className="form-field">
          <label htmlFor={`${name}-details`}>{detailsLabel}</label>
          <input
            id={`${name}-details`}
            type="text"
            value={details}
            onChange={(e) => onChange('details', e.target.value)}
          />
        </div>
      ) : null}
    </div>
  )
}

export default YesNoRow
