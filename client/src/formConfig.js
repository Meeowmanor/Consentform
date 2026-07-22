const today = () => new Date().toISOString().slice(0, 10)

export const initialFormState = {
  cat: {
    name: '',
    dateOfBirthOrAge: '',
    breed: '',
    gender: { male: false, female: false, neutered: false, spayed: false },
    colorMarkings: '',
    microchipId: '',
    weight: '',
  },
  guardian: {
    fullName: '',
    phoneNumber: '',
    alternateNumber: '',
    email: '',
    fullAddress: '',
  },
  veterinary: {
    primaryVeterinarian: '',
    clinicName: '',
    clinicContactNumber: '',
    clinicAddress: '',
  },
  health: {
    documents: {
      vaccinationRecord: false,
      dewormingRecord: false,
      tickFleaTreatmentRecord: false,
      recentLabReports: false,
    },
    currentMedication: { value: '', details: '' },
    medicalConditionsOrAllergies: { value: '', details: '' },
    recentIllnessSurgeryHospitalization: { value: '', details: '' },
  },
  feeding: {
    currentFood: '',
    feedingSchedule: { twoMeals: false, threeMeals: false, freeFeed: false },
    amountPerMeal: '',
    foodAllergiesOrIntolerances: '',
    treatsAllowed: { value: '', details: '' },
  },
  behavior: {
    litterBoxTrained: '',
    getsAlongWithCats: '',
    getsAlongWithDogs: '',
    shyAnxiousOrAggressive: { value: '', details: '' },
    otherHabitsPreferences: '',
  },
  boarding: {
    checkInDate: '',
    checkOutDate: '',
    dropOffTime: '',
    pickUpTime: '',
    specialRequests: '',
    stayPlanId: '',
    hours: 1,
  },
  consent: {
    agreed: false,
    parentGuardianName: '',
    signature: '',
    signedDate: today(),
  },
}

export const STAY_PLAN_OPTIONS = [
  { id: 'standard-stay', name: 'Standard Stay', rate: 399, unit: 'night', label: 'Standard Stay — ₹399 / night' },
  { id: 'private-stay', name: 'Private Stay', rate: 499, unit: 'night', label: 'Private Stay — ₹499 / night' },
  { id: 'day-care', name: 'Day Care', rate: 299, unit: 'day', label: 'Day Care — ₹299 / day' },
  { id: 'hourly-stay', name: 'Hourly Stay', rate: 50, unit: 'hour', label: 'Hourly Stay — ₹50 / hour' },
]

export function isValidIndianMobile(value) {
  const digits = String(value).replace(/\D/g, '')
  if (/^[6-9]\d{9}$/.test(digits)) return true
  if (/^91[6-9]\d{9}$/.test(digits)) return true
  return false
}

export function validateConsentForm(form) {
  const errors = {}

  if (!form.cat.name.trim()) errors.catName = 'Cat name is required.'
  if (!form.guardian.fullName.trim()) errors.guardianName = 'Full name is required.'
  if (!form.guardian.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required.'
  } else if (!isValidIndianMobile(form.guardian.phoneNumber)) {
    errors.phoneNumber = 'Enter a valid Indian mobile number.'
  }
  if (!form.guardian.email.trim()) errors.email = 'Email address is required.'
  if (!form.guardian.fullAddress.trim()) errors.fullAddress = 'Full address is required.'
  if (!form.boarding.checkInDate) errors.checkInDate = 'Check-in date is required.'
  if (!form.boarding.checkOutDate) errors.checkOutDate = 'Check-out date is required.'
  else if (
    form.boarding.checkInDate &&
    form.boarding.checkOutDate < form.boarding.checkInDate
  ) {
    errors.checkOutDate = 'Check-out cannot be earlier than check-in.'
  }
  if (!form.boarding.stayPlanId) errors.stayPlanId = 'Please select a stay plan.'
  if (form.boarding.stayPlanId === 'hourly-stay') {
    const hours = Number(form.boarding.hours)
    if (!hours || hours < 1) errors.hours = 'Hours must be at least 1.'
  }
  if (!form.consent.agreed) errors.agreed = 'You must agree to the terms.'
  if (!form.consent.parentGuardianName.trim()) {
    errors.consentName = 'Parent / guardian name is required.'
  }
  if (!form.consent.signature.trim()) errors.signature = 'Signature is required.'
  if (!form.consent.signedDate) errors.signedDate = 'Date is required.'

  return errors
}
