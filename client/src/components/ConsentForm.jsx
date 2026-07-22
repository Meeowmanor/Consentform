import { useEffect, useMemo, useState } from 'react'
import logo from '../assets/meow-manor-logo.png'
import YesNoRow from './YesNoRow'
import {
  STAY_PLAN_OPTIONS,
  initialFormState,
  validateConsentForm,
} from '../formConfig'

const API_BASE = '/api/consent-forms'

function setNested(obj, path, value) {
  const keys = path.split('.')
  const next = structuredClone(obj)
  let cursor = next
  for (let i = 0; i < keys.length - 1; i += 1) {
    cursor = cursor[keys[i]]
  }
  cursor[keys[keys.length - 1]] = value
  return next
}

function ConsentForm() {
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)
  const [guestStatus, setGuestStatus] = useState(null)
  const [pricing, setPricing] = useState(null)

  const update = (path, value) => {
    setForm((prev) => setNested(prev, path, value))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[path.split('.').pop()]
      return next
    })
    setStatus(null)
  }

  const updateYesNo = (path, field, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let cursor = next
      for (const key of keys) cursor = cursor[key]
      cursor[field] = value
      if (field === 'value' && value === 'No') cursor.details = ''
      return next
    })
    setStatus(null)
  }

  const selectedPlan = useMemo(
    () => STAY_PLAN_OPTIONS.find((p) => p.id === form.boarding.stayPlanId) || null,
    [form.boarding.stayPlanId],
  )

  useEffect(() => {
    const email = form.guardian.email.trim()
    const phone = form.guardian.phoneNumber.trim()
    if (!email && !phone) {
      setGuestStatus(null)
      return undefined
    }

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (email) params.set('email', email)
        if (phone) params.set('phoneNumber', phone)
        const res = await fetch(`${API_BASE}/check-guest?${params}`)
        if (!res.ok) return
        const data = await res.json()
        setGuestStatus(data)
      } catch {
        /* ignore preview errors while typing */
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [form.guardian.email, form.guardian.phoneNumber])

  useEffect(() => {
    if (!form.boarding.stayPlanId || !form.boarding.checkInDate || !form.boarding.checkOutDate) {
      setPricing(null)
      return undefined
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/preview-pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.guardian.email,
            phoneNumber: form.guardian.phoneNumber,
            stayPlanId: form.boarding.stayPlanId,
            checkInDate: form.boarding.checkInDate,
            checkOutDate: form.boarding.checkOutDate,
            hours: form.boarding.hours,
          }),
        })
        if (!res.ok) return
        const data = await res.json()
        setPricing(data)
      } catch {
        /* ignore */
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [
    form.guardian.email,
    form.guardian.phoneNumber,
    form.boarding.stayPlanId,
    form.boarding.checkInDate,
    form.boarding.checkOutDate,
    form.boarding.hours,
  ])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateConsentForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setStatus({ type: 'error', text: 'Please fix the highlighted fields and try again.' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({
          type: 'error',
          text: data.errors?.join(' ') || data.message || 'Could not save the form.',
        })
        return
      }

      setStatus({
        type: 'success',
        text: data.message,
        pricing: data.pricing,
        isFirstTimeGuest: data.isFirstTimeGuest,
      })
      setForm({
        ...initialFormState,
        consent: {
          ...initialFormState.consent,
          signedDate: new Date().toISOString().slice(0, 10),
        },
      })
      setPricing(null)
      setGuestStatus(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setStatus({ type: 'error', text: 'Network error. Is the API server running?' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <img src={logo} alt="The Meeow Manor logo" className="form-header__logo" />
        <div>
          <p className="form-header__eyebrow">Cat Boarding</p>
          <h1>The Meeow Manor</h1>
          <p className="form-header__subtitle">Boarding Intake &amp; Consent Form</p>
        </div>
      </header>

      {guestStatus ? (
        <div className={`banner ${guestStatus.isFirstTime ? 'banner--offer' : 'banner--info'}`}>
          {guestStatus.message}
        </div>
      ) : null}

      {status?.type === 'success' ? (
        <div className="banner banner--success" role="status">
          <p>{status.text}</p>
          {status.pricing ? (
            <p className="banner__meta">
              Subtotal ₹{status.pricing.subtotal}
              {status.pricing.firstTimeDiscountApplied
                ? ` − ₹${status.pricing.discountAmount} first-stay discount`
                : ''}{' '}
              = <strong>₹{status.pricing.total}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {status?.type === 'error' ? (
        <div className="banner banner--error" role="alert">
          {status.text}
        </div>
      ) : null}

      <form className="consent-form" onSubmit={handleSubmit} noValidate>
        {/* 1. Cat Information */}
        <section className="form-section">
          <h2>1. Cat Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="catName">
                Cat&apos;s Name <span className="required">*</span>
              </label>
              <input
                id="catName"
                value={form.cat.name}
                onChange={(e) => update('cat.name', e.target.value)}
              />
              {errors.catName ? <span className="error">{errors.catName}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="dob">Date of Birth / Age</label>
              <input
                id="dob"
                value={form.cat.dateOfBirthOrAge}
                onChange={(e) => update('cat.dateOfBirthOrAge', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="breed">Breed</label>
              <input
                id="breed"
                value={form.cat.breed}
                onChange={(e) => update('cat.breed', e.target.value)}
              />
            </div>
            <div className="form-field form-field--full">
              <span className="field-label">Gender</span>
              <div className="check-group">
                {[
                  ['male', 'Male'],
                  ['female', 'Female'],
                  ['neutered', 'Neutered'],
                  ['spayed', 'Spayed'],
                ].map(([key, label]) => (
                  <label key={key} className="check-option">
                    <input
                      type="checkbox"
                      checked={form.cat.gender[key]}
                      onChange={(e) => update(`cat.gender.${key}`, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="color">Color / Markings</label>
              <input
                id="color"
                value={form.cat.colorMarkings}
                onChange={(e) => update('cat.colorMarkings', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="microchip">Microchip ID (if any)</label>
              <input
                id="microchip"
                value={form.cat.microchipId}
                onChange={(e) => update('cat.microchipId', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="weight">Weight</label>
              <input
                id="weight"
                value={form.cat.weight}
                onChange={(e) => update('cat.weight', e.target.value)}
                placeholder="e.g. 4.2 kg"
              />
            </div>
          </div>
        </section>

        {/* 2. Parent / Guardian */}
        <section className="form-section">
          <h2>2. Parent / Guardian Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="guardianName">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="guardianName"
                value={form.guardian.fullName}
                onChange={(e) => update('guardian.fullName', e.target.value)}
                autoComplete="name"
              />
              {errors.guardianName ? <span className="error">{errors.guardianName}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={form.guardian.phoneNumber}
                onChange={(e) => update('guardian.phoneNumber', e.target.value)}
                placeholder="10-digit Indian mobile"
              />
              {errors.phoneNumber ? <span className="error">{errors.phoneNumber}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="altPhone">Alternate Number</label>
              <input
                id="altPhone"
                type="tel"
                value={form.guardian.alternateNumber}
                onChange={(e) => update('guardian.alternateNumber', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={form.guardian.email}
                onChange={(e) => update('guardian.email', e.target.value)}
                autoComplete="email"
              />
              {errors.email ? <span className="error">{errors.email}</span> : null}
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="address">
                Full Address <span className="required">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                value={form.guardian.fullAddress}
                onChange={(e) => update('guardian.fullAddress', e.target.value)}
              />
              {errors.fullAddress ? <span className="error">{errors.fullAddress}</span> : null}
            </div>
          </div>
        </section>

        {/* 3. Veterinary */}
        <section className="form-section">
          <h2>3. Veterinary Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="vet">Primary Veterinarian</label>
              <input
                id="vet"
                value={form.veterinary.primaryVeterinarian}
                onChange={(e) => update('veterinary.primaryVeterinarian', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="clinic">Clinic Name</label>
              <input
                id="clinic"
                value={form.veterinary.clinicName}
                onChange={(e) => update('veterinary.clinicName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="clinicPhone">Clinic Contact Number</label>
              <input
                id="clinicPhone"
                type="tel"
                value={form.veterinary.clinicContactNumber}
                onChange={(e) => update('veterinary.clinicContactNumber', e.target.value)}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="clinicAddress">Clinic Address</label>
              <textarea
                id="clinicAddress"
                rows={2}
                value={form.veterinary.clinicAddress}
                onChange={(e) => update('veterinary.clinicAddress', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 4. Health */}
        <section className="form-section">
          <h2>4. Health Information</h2>
          <div className="form-field form-field--full">
            <span className="field-label">Please attach / confirm the following documents</span>
            <div className="check-group check-group--stack">
              {[
                ['vaccinationRecord', 'Vaccination Record'],
                ['dewormingRecord', 'Deworming Record'],
                ['tickFleaTreatmentRecord', 'Tick & Flea Treatment Record'],
                ['recentLabReports', 'Any Recent Lab Reports (if any)'],
              ].map(([key, label]) => (
                <label key={key} className="check-option">
                  <input
                    type="checkbox"
                    checked={form.health.documents[key]}
                    onChange={(e) => update(`health.documents.${key}`, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="stack-gap">
            <YesNoRow
              label="Is your cat currently on any medication or supplements?"
              name="currentMedication"
              value={form.health.currentMedication.value}
              details={form.health.currentMedication.details}
              detailsLabel="If yes, please specify"
              onChange={(field, value) => updateYesNo('health.currentMedication', field, value)}
            />
            <YesNoRow
              label="Any known medical conditions or allergies?"
              name="medicalConditions"
              value={form.health.medicalConditionsOrAllergies.value}
              details={form.health.medicalConditionsOrAllergies.details}
              detailsLabel="If yes, please specify"
              onChange={(field, value) =>
                updateYesNo('health.medicalConditionsOrAllergies', field, value)
              }
            />
            <YesNoRow
              label="Any recent illness, surgery, or hospitalization?"
              name="recentIllness"
              value={form.health.recentIllnessSurgeryHospitalization.value}
              details={form.health.recentIllnessSurgeryHospitalization.details}
              detailsLabel="If yes, please provide details and dates"
              onChange={(field, value) =>
                updateYesNo('health.recentIllnessSurgeryHospitalization', field, value)
              }
            />
          </div>
        </section>

        {/* 5. Feeding */}
        <section className="form-section">
          <h2>5. Feeding Information</h2>
          <div className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="food">Current Food (Brand &amp; Type)</label>
              <input
                id="food"
                value={form.feeding.currentFood}
                onChange={(e) => update('feeding.currentFood', e.target.value)}
              />
            </div>
            <div className="form-field form-field--full">
              <span className="field-label">Feeding Schedule</span>
              <div className="check-group">
                {[
                  ['twoMeals', '2 Meals'],
                  ['threeMeals', '3 Meals'],
                  ['freeFeed', 'Free Feed'],
                ].map(([key, label]) => (
                  <label key={key} className="check-option">
                    <input
                      type="checkbox"
                      checked={form.feeding.feedingSchedule[key]}
                      onChange={(e) =>
                        update(`feeding.feedingSchedule.${key}`, e.target.checked)
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="amount">Amount per meal</label>
              <input
                id="amount"
                value={form.feeding.amountPerMeal}
                onChange={(e) => update('feeding.amountPerMeal', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="foodAllergy">Any Food Allergies or Intolerances</label>
              <input
                id="foodAllergy"
                value={form.feeding.foodAllergiesOrIntolerances}
                onChange={(e) => update('feeding.foodAllergiesOrIntolerances', e.target.value)}
              />
            </div>
          </div>
          <div className="stack-gap">
            <YesNoRow
              label="Treats Allowed?"
              name="treatsAllowed"
              value={form.feeding.treatsAllowed.value}
              details={form.feeding.treatsAllowed.details}
              detailsLabel="If yes, what kind?"
              onChange={(field, value) => updateYesNo('feeding.treatsAllowed', field, value)}
            />
          </div>
        </section>

        {/* 6. Behavior */}
        <section className="form-section">
          <h2>6. Behavior &amp; Habits</h2>
          <div className="stack-gap">
            {[
              ['litterBoxTrained', 'Litter box trained?'],
              ['getsAlongWithCats', 'Gets along with other cats?'],
              ['getsAlongWithDogs', 'Gets along with dogs?'],
            ].map(([key, label]) => (
              <div key={key} className="yesno-row">
                <div className="yesno-row__question">
                  <span className="field-label">{label}</span>
                  <div className="radio-group" role="radiogroup" aria-label={label}>
                    {['Yes', 'No'].map((option) => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name={key}
                          value={option}
                          checked={form.behavior[key] === option}
                          onChange={() => update(`behavior.${key}`, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <YesNoRow
              label="Shy, anxious, or aggressive?"
              name="shyAnxious"
              value={form.behavior.shyAnxiousOrAggressive.value}
              details={form.behavior.shyAnxiousOrAggressive.details}
              detailsLabel="If yes, please explain"
              onChange={(field, value) =>
                updateYesNo('behavior.shyAnxiousOrAggressive', field, value)
              }
            />
            <div className="form-field">
              <label htmlFor="habits">Other habits / preferences</label>
              <textarea
                id="habits"
                rows={3}
                value={form.behavior.otherHabitsPreferences}
                onChange={(e) => update('behavior.otherHabitsPreferences', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 7. Boarding Details */}
        <section className="form-section">
          <h2>7. Boarding Details</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="checkIn">
                Check-in Date <span className="required">*</span>
              </label>
              <input
                id="checkIn"
                type="date"
                value={form.boarding.checkInDate}
                onChange={(e) => update('boarding.checkInDate', e.target.value)}
              />
              {errors.checkInDate ? <span className="error">{errors.checkInDate}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="checkOut">
                Check-out Date <span className="required">*</span>
              </label>
              <input
                id="checkOut"
                type="date"
                value={form.boarding.checkOutDate}
                onChange={(e) => update('boarding.checkOutDate', e.target.value)}
              />
              {errors.checkOutDate ? <span className="error">{errors.checkOutDate}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="dropOff">Drop-off Time</label>
              <input
                id="dropOff"
                type="time"
                value={form.boarding.dropOffTime}
                onChange={(e) => update('boarding.dropOffTime', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="pickUp">Pick-up Time</label>
              <input
                id="pickUp"
                type="time"
                value={form.boarding.pickUpTime}
                onChange={(e) => update('boarding.pickUpTime', e.target.value)}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="stayPlan">
                Stay Plan <span className="required">*</span>
              </label>
              <select
                id="stayPlan"
                value={form.boarding.stayPlanId}
                onChange={(e) => update('boarding.stayPlanId', e.target.value)}
              >
                <option value="">Select a stay plan</option>
                {STAY_PLAN_OPTIONS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label}
                  </option>
                ))}
              </select>
              {errors.stayPlanId ? <span className="error">{errors.stayPlanId}</span> : null}
            </div>
            {selectedPlan?.unit === 'hour' ? (
              <div className="form-field">
                <label htmlFor="hours">
                  Hours <span className="required">*</span>
                </label>
                <input
                  id="hours"
                  type="number"
                  min="1"
                  step="1"
                  value={form.boarding.hours}
                  onChange={(e) => update('boarding.hours', Number(e.target.value))}
                />
                {errors.hours ? <span className="error">{errors.hours}</span> : null}
              </div>
            ) : null}
            <div className="form-field form-field--full">
              <label htmlFor="notes">Special Requests / Notes</label>
              <textarea
                id="notes"
                rows={3}
                value={form.boarding.specialRequests}
                onChange={(e) => update('boarding.specialRequests', e.target.value)}
              />
            </div>
          </div>

          {pricing ? (
            <div className="pricing-box">
              <h3>Boarding estimate</h3>
              <p>
                {pricing.stayPlan.name} · ₹{pricing.rate}
                {pricing.nights > 0 ? ` × ${pricing.nights} night(s)` : ''}
                {pricing.hours > 0 ? ` × ${pricing.hours} hour(s)` : ''}
              </p>
              <p>Subtotal: ₹{pricing.subtotal}</p>
              <p>
                First-stay discount:{' '}
                {pricing.firstTimeDiscountApplied
                  ? `− ₹${pricing.discountAmount}`
                  : 'Not applicable (returning guest)'}
              </p>
              <p className="pricing-box__total">Total: ₹{pricing.total}</p>
            </div>
          ) : null}
        </section>

        {/* 8. Terms & Consent */}
        <section className="form-section">
          <h2>8. Terms &amp; Consent</h2>
          <p className="consent-text">
            I confirm that the information provided above is true and accurate. I understand that
            The Meeow Manor is not liable for any pre-existing health conditions or emergencies
            beyond our control. I agree to abide by the boarding policies and terms &amp;
            conditions.
          </p>
          <label className="check-option check-option--consent">
            <input
              type="checkbox"
              checked={form.consent.agreed}
              onChange={(e) => update('consent.agreed', e.target.checked)}
            />
            I agree to the terms above <span className="required">*</span>
          </label>
          {errors.agreed ? <span className="error">{errors.agreed}</span> : null}

          <div className="form-grid" style={{ marginTop: '1rem' }}>
            <div className="form-field">
              <label htmlFor="consentName">
                Parent / Guardian Name <span className="required">*</span>
              </label>
              <input
                id="consentName"
                value={form.consent.parentGuardianName}
                onChange={(e) => update('consent.parentGuardianName', e.target.value)}
              />
              {errors.consentName ? <span className="error">{errors.consentName}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="signature">
                Signature <span className="required">*</span>
              </label>
              <input
                id="signature"
                className="signature-input"
                value={form.consent.signature}
                onChange={(e) => update('consent.signature', e.target.value)}
                placeholder="Type your full name as signature"
              />
              {errors.signature ? <span className="error">{errors.signature}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="signedDate">
                Date <span className="required">*</span>
              </label>
              <input
                id="signedDate"
                type="date"
                value={form.consent.signedDate}
                onChange={(e) => update('consent.signedDate', e.target.value)}
              />
              {errors.signedDate ? <span className="error">{errors.signedDate}</span> : null}
            </div>
          </div>
        </section>

        <button type="submit" className="btn btn--full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Submit Consent Form'}
        </button>
      </form>
    </div>
  )
}

export default ConsentForm
