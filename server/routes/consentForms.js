import { Router } from 'express'
import { Owner } from '../models/Owner.js'
import { Cat } from '../models/Cat.js'
import { ConsentForm } from '../models/ConsentForm.js'
import {
  STAY_PLANS,
  calculateBoardingTotal,
  applyFirstTimeDiscount,
  FIRST_TIME_DISCOUNT,
} from '../utils/pricing.js'

const router = Router()

function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '')
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

function isValidIndianMobile(value) {
  const digits = normalizePhone(value)
  if (/^[6-9]\d{9}$/.test(digits)) return true
  if (/^91[6-9]\d{9}$/.test(digits)) return true
  return false
}

function yesNoDetail(input = {}) {
  return {
    value: input.value === 'Yes' || input.value === 'No' ? input.value : '',
    details: String(input.details || '').trim(),
  }
}

async function findExistingOwner(email, phoneNumber) {
  const normalizedEmail = normalizeEmail(email)
  const phoneDigits = normalizePhone(phoneNumber)
  const or = []

  if (normalizedEmail) or.push({ email: normalizedEmail })
  if (phoneDigits) {
    or.push({ phoneDigits })
    // legacy records without phoneDigits
    or.push({ phoneNumber })
  }
  if (!or.length) return null

  const candidates = await Owner.find({ $or: or }).lean()
  return (
    candidates.find(
      (owner) =>
        (normalizedEmail && owner.email === normalizedEmail) ||
        (phoneDigits &&
          (owner.phoneDigits === phoneDigits ||
            normalizePhone(owner.phoneNumber) === phoneDigits)),
    ) || null
  )
}

router.get('/stay-plans', (_req, res) => {
  res.json({
    stayPlans: Object.values(STAY_PLANS),
    firstTimeDiscount: FIRST_TIME_DISCOUNT,
  })
})

router.get('/check-guest', async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email || '')
    const phoneNumber = String(req.query.phoneNumber || '').trim()

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phone number is required.' })
    }

    const existing = await findExistingOwner(email, phoneNumber)
    const isFirstTime = !existing || existing.visitCount === 0

    res.json({
      isFirstTime,
      discountAmount: isFirstTime ? FIRST_TIME_DISCOUNT : 0,
      message: isFirstTime
        ? `First-time guest — ₹${FIRST_TIME_DISCOUNT} OFF boarding applies.`
        : 'Returning guest — first-stay discount does not apply.',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to check guest status.' })
  }
})

router.post('/preview-pricing', async (req, res) => {
  try {
    const { email, phoneNumber, stayPlanId, checkInDate, checkOutDate, hours } = req.body
    const existing = await findExistingOwner(email || '', phoneNumber || '')
    const isFirstTime = !existing || existing.visitCount === 0
    const boarding = calculateBoardingTotal({
      stayPlanId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      hours,
    })

    if (!boarding.plan) {
      return res.status(400).json({ message: 'Invalid stay plan selected.' })
    }

    const priced = applyFirstTimeDiscount(boarding.subtotal, isFirstTime)

    res.json({
      isFirstTime,
      stayPlan: boarding.plan,
      nights: boarding.nights,
      hours: boarding.hours,
      rate: boarding.plan.rate,
      subtotal: boarding.subtotal,
      ...priced,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to preview pricing.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const cat = body.cat || {}
    const guardian = body.guardian || {}
    const boarding = body.boarding || {}
    const consent = body.consent || {}

    const errors = []
    if (!cat.name?.trim()) errors.push('Cat name is required.')
    if (!guardian.fullName?.trim()) errors.push('Parent / guardian name is required.')
    if (!guardian.phoneNumber?.trim()) errors.push('Phone number is required.')
    else if (!isValidIndianMobile(guardian.phoneNumber)) {
      errors.push('Enter a valid Indian mobile number.')
    }
    if (!guardian.email?.trim()) errors.push('Email address is required.')
    if (!guardian.fullAddress?.trim()) errors.push('Full address is required.')
    if (!boarding.checkInDate) errors.push('Check-in date is required.')
    if (!boarding.checkOutDate) errors.push('Check-out date is required.')
    if (
      boarding.checkInDate &&
      boarding.checkOutDate &&
      boarding.checkOutDate < boarding.checkInDate
    ) {
      errors.push('Check-out date cannot be earlier than check-in date.')
    }
    if (!boarding.stayPlanId || !STAY_PLANS[boarding.stayPlanId]) {
      errors.push('Please select a stay plan.')
    }
    if (!consent.agreed) errors.push('You must agree to the terms & consent.')
    if (!consent.parentGuardianName?.trim()) {
      errors.push('Consent parent / guardian name is required.')
    }
    if (!consent.signature?.trim()) errors.push('Signature is required.')
    if (!consent.signedDate) errors.push('Consent date is required.')

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed.', errors })
    }

    const email = normalizeEmail(guardian.email)
    const phoneNumber = String(guardian.phoneNumber).trim()
    const existingOwner = await findExistingOwner(email, phoneNumber)
    const isFirstTime = !existingOwner || existingOwner.visitCount === 0

    const boardingCalc = calculateBoardingTotal({
      stayPlanId: boarding.stayPlanId,
      checkIn: boarding.checkInDate,
      checkOut: boarding.checkOutDate,
      hours: boarding.hours,
    })
    const priced = applyFirstTimeDiscount(boardingCalc.subtotal, isFirstTime)

    let ownerDoc
    const phoneDigits = normalizePhone(phoneNumber)
    if (existingOwner) {
      ownerDoc = await Owner.findByIdAndUpdate(
        existingOwner._id,
        {
          fullName: guardian.fullName.trim(),
          phoneNumber,
          phoneDigits,
          alternateNumber: String(guardian.alternateNumber || '').trim(),
          email,
          fullAddress: guardian.fullAddress.trim(),
          $inc: { visitCount: 1 },
        },
        { new: true },
      )
    } else {
      ownerDoc = await Owner.create({
        fullName: guardian.fullName.trim(),
        phoneNumber,
        phoneDigits,
        alternateNumber: String(guardian.alternateNumber || '').trim(),
        email,
        fullAddress: guardian.fullAddress.trim(),
        visitCount: 1,
      })
    }

    const catDoc = await Cat.create({
      ownerId: ownerDoc._id,
      name: cat.name.trim(),
      dateOfBirthOrAge: String(cat.dateOfBirthOrAge || '').trim(),
      breed: String(cat.breed || '').trim(),
      gender: {
        male: Boolean(cat.gender?.male),
        female: Boolean(cat.gender?.female),
        neutered: Boolean(cat.gender?.neutered),
        spayed: Boolean(cat.gender?.spayed),
      },
      colorMarkings: String(cat.colorMarkings || '').trim(),
      microchipId: String(cat.microchipId || '').trim(),
      weight: String(cat.weight || '').trim(),
    })

    const formDoc = await ConsentForm.create({
      ownerId: ownerDoc._id,
      catId: catDoc._id,
      veterinary: {
        primaryVeterinarian: String(body.veterinary?.primaryVeterinarian || '').trim(),
        clinicName: String(body.veterinary?.clinicName || '').trim(),
        clinicContactNumber: String(body.veterinary?.clinicContactNumber || '').trim(),
        clinicAddress: String(body.veterinary?.clinicAddress || '').trim(),
      },
      health: {
        documents: {
          vaccinationRecord: Boolean(body.health?.documents?.vaccinationRecord),
          dewormingRecord: Boolean(body.health?.documents?.dewormingRecord),
          tickFleaTreatmentRecord: Boolean(body.health?.documents?.tickFleaTreatmentRecord),
          recentLabReports: Boolean(body.health?.documents?.recentLabReports),
        },
        currentMedication: yesNoDetail(body.health?.currentMedication),
        medicalConditionsOrAllergies: yesNoDetail(body.health?.medicalConditionsOrAllergies),
        recentIllnessSurgeryHospitalization: yesNoDetail(
          body.health?.recentIllnessSurgeryHospitalization,
        ),
      },
      feeding: {
        currentFood: String(body.feeding?.currentFood || '').trim(),
        feedingSchedule: {
          twoMeals: Boolean(body.feeding?.feedingSchedule?.twoMeals),
          threeMeals: Boolean(body.feeding?.feedingSchedule?.threeMeals),
          freeFeed: Boolean(body.feeding?.feedingSchedule?.freeFeed),
        },
        amountPerMeal: String(body.feeding?.amountPerMeal || '').trim(),
        foodAllergiesOrIntolerances: String(
          body.feeding?.foodAllergiesOrIntolerances || '',
        ).trim(),
        treatsAllowed: yesNoDetail(body.feeding?.treatsAllowed),
      },
      behavior: {
        litterBoxTrained:
          body.behavior?.litterBoxTrained === 'Yes' || body.behavior?.litterBoxTrained === 'No'
            ? body.behavior.litterBoxTrained
            : '',
        getsAlongWithCats:
          body.behavior?.getsAlongWithCats === 'Yes' || body.behavior?.getsAlongWithCats === 'No'
            ? body.behavior.getsAlongWithCats
            : '',
        getsAlongWithDogs:
          body.behavior?.getsAlongWithDogs === 'Yes' || body.behavior?.getsAlongWithDogs === 'No'
            ? body.behavior.getsAlongWithDogs
            : '',
        shyAnxiousOrAggressive: yesNoDetail(body.behavior?.shyAnxiousOrAggressive),
        otherHabitsPreferences: String(body.behavior?.otherHabitsPreferences || '').trim(),
      },
      boarding: {
        checkInDate: boarding.checkInDate,
        checkOutDate: boarding.checkOutDate,
        dropOffTime: String(boarding.dropOffTime || ''),
        pickUpTime: String(boarding.pickUpTime || ''),
        specialRequests: String(boarding.specialRequests || '').trim(),
        stayPlanId: boardingCalc.plan.id,
        stayPlanName: boardingCalc.plan.name,
        hours: boardingCalc.hours || Number(boarding.hours) || 1,
      },
      pricing: {
        rate: boardingCalc.plan.rate,
        nights: boardingCalc.nights,
        hours: boardingCalc.hours,
        subtotal: boardingCalc.subtotal,
        discountAmount: priced.discountAmount,
        firstTimeDiscountApplied: priced.firstTimeDiscountApplied,
        total: priced.total,
      },
      consent: {
        agreed: true,
        parentGuardianName: consent.parentGuardianName.trim(),
        signature: consent.signature.trim(),
        signedDate: consent.signedDate,
      },
      isFirstTimeGuest: isFirstTime,
    })

    res.status(201).json({
      message: isFirstTime
        ? `Consent form saved. First-time guest discount of ₹${FIRST_TIME_DISCOUNT} applied.`
        : 'Consent form saved. Returning guest — no first-stay discount applied.',
      formId: formDoc._id,
      ownerId: ownerDoc._id,
      catId: catDoc._id,
      isFirstTimeGuest: isFirstTime,
      pricing: formDoc.pricing,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to save consent form.' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const forms = await ConsentForm.find()
      .sort({ createdAt: -1 })
      .populate('ownerId', 'fullName phoneNumber email')
      .populate('catId', 'name breed')
      .lean()
    res.json({ forms })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to fetch consent forms.' })
  }
})

export default router
