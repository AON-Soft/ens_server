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
    transacion: String,
  },
  receiver: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    transacion: String,
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Points'],
    required: true,
  },
  invoiceID: {
    type: String,
  },
  transactionType: {
    type: String,
    enum: ['pointsIn', 'pointsOut', 'payment', 'sendPoints'],
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

module.exports = mongoose.model('Transaction', transactionSchema)
