const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  transactionID: {
    type: String,
    unique: true,
    required: true,
  },
  transactionAmount: {
    type: Number,
    required: true,
  },
  serviceCharge: {
    type: Number,
    required: true,
  },
  sender: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    flag: String,
    transactionHeading: String,
  },
  receiver: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    flag: String,
    transactionHeading: String,
  },
  paymentType: {
    type: String,
    enum: ['bonus_points', 'points'],
    required: true,
  },
  invoiceID: {
    type: String,
  },
  transactionType: {
    type: String,
    enum: [
      'points_in',
      'points_out',
      'payment',
      'send_points',
      'referal_bonus',
      'received_bonus',
    ],
    required: true,
  },
  transactionRelation: {
    type: String,
    enum: [
      'user-To-user',
      'user-To-agent',
      'user-To-shop_keeper',
      'agent-To-agent',
      'agent-To-admin',
      'agent-To-user',
      'agent-To-shop_keeper',
      'admin-To-admin',
      'admin-To-agent',
      'shop_keeper-To-agent',
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

transactionSchema.index({ transactionRelation: 1 })

module.exports = mongoose.model('Transaction', transactionSchema)
