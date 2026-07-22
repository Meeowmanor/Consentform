import mongoose from 'mongoose'

const yesNoDetailSchema = new mongoose.Schema(
  {
    value: { type: String, enum: ['Yes', 'No', ''], default: '' },
    details: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const consentFormSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true, index: true },
    catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true, index: true },

    veterinary: {
      primaryVeterinarian: { type: String, trim: true, default: '' },
      clinicName: { type: String, trim: true, default: '' },
      clinicContactNumber: { type: String, trim: true, default: '' },
      clinicAddress: { type: String, trim: true, default: '' },
    },

    health: {
      documents: {
        vaccinationRecord: { type: Boolean, default: false },
        dewormingRecord: { type: Boolean, default: false },
        tickFleaTreatmentRecord: { type: Boolean, default: false },
        recentLabReports: { type: Boolean, default: false },
      },
      currentMedication: yesNoDetailSchema,
      medicalConditionsOrAllergies: yesNoDetailSchema,
      recentIllnessSurgeryHospitalization: yesNoDetailSchema,
    },

    feeding: {
      currentFood: { type: String, trim: true, default: '' },
      feedingSchedule: {
        twoMeals: { type: Boolean, default: false },
        threeMeals: { type: Boolean, default: false },
        freeFeed: { type: Boolean, default: false },
      },
      amountPerMeal: { type: String, trim: true, default: '' },
      foodAllergiesOrIntolerances: { type: String, trim: true, default: '' },
      treatsAllowed: yesNoDetailSchema,
    },

    behavior: {
      litterBoxTrained: { type: String, enum: ['Yes', 'No', ''], default: '' },
      getsAlongWithCats: { type: String, enum: ['Yes', 'No', ''], default: '' },
      getsAlongWithDogs: { type: String, enum: ['Yes', 'No', ''], default: '' },
      shyAnxiousOrAggressive: yesNoDetailSchema,
      otherHabitsPreferences: { type: String, trim: true, default: '' },
    },

    boarding: {
      checkInDate: { type: String, required: true },
      checkOutDate: { type: String, required: true },
      dropOffTime: { type: String, default: '' },
      pickUpTime: { type: String, default: '' },
      specialRequests: { type: String, trim: true, default: '' },
      stayPlanId: { type: String, required: true },
      stayPlanName: { type: String, required: true },
      hours: { type: Number, default: 1 },
    },

    pricing: {
      rate: { type: Number, required: true },
      nights: { type: Number, default: 0 },
      hours: { type: Number, default: 0 },
      subtotal: { type: Number, required: true },
      discountAmount: { type: Number, default: 0 },
      firstTimeDiscountApplied: { type: Boolean, default: false },
      total: { type: Number, required: true },
    },

    consent: {
      agreed: { type: Boolean, required: true },
      parentGuardianName: { type: String, required: true, trim: true },
      signature: { type: String, required: true, trim: true },
      signedDate: { type: String, required: true },
    },

    isFirstTimeGuest: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const ConsentForm = mongoose.model('ConsentForm', consentFormSchema, 'consent_forms')
