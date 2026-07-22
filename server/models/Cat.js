import mongoose from 'mongoose'

const catSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dateOfBirthOrAge: { type: String, trim: true, default: '' },
    breed: { type: String, trim: true, default: '' },
    gender: {
      male: { type: Boolean, default: false },
      female: { type: Boolean, default: false },
      neutered: { type: Boolean, default: false },
      spayed: { type: Boolean, default: false },
    },
    colorMarkings: { type: String, trim: true, default: '' },
    microchipId: { type: String, trim: true, default: '' },
    weight: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

export const Cat = mongoose.model('Cat', catSchema, 'cats')
