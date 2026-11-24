import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Embedded message sub-schema
 */
const messageSchema = new Schema(
  {
    messageId: {
      type: String,
      default: null,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Conversation schema
 */
const conversationSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: null,
    },
    messages: [messageSchema],
    needsHuman: {
      type: Boolean,
      default: false,
    },
    handoffReason: {
      type: String,
      default: null,
    },
    handoffAt: {
      type: Date,
      default: null,
    },
    handoffStatus: {
      type: String,
      enum: ['pending', 'resolved', null],
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ needsHuman: 1, handoffStatus: 1 });
conversationSchema.index({ handoffAt: -1 });

export const Conversation = model('Conversation', conversationSchema);
export default Conversation;
