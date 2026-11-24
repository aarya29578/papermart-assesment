import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Lead schema
 * Represents customer interest in specific products/services
 */
const leadSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    productOfInterest: {
      type: String,
      trim: true,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = model('Lead', leadSchema);
export default Lead;
