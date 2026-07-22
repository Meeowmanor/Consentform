import mongoose from 'mongoose'

const ownerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    phoneDigits: { type: String, required: true, trim: true, index: true },
    alternateNumber: { type: String, trim: true, default: '' },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    fullAddress: { type: String, required: true, trim: true },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Owner = mongoose.model('Owner', ownerSchema, 'owners')
