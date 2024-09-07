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
    validate: {
      validator: function (value) {
        return !isNaN(parseFloat(value)) && isFinite(value)
      },
      message: 'Transaction amount must be a valid number.',
    },
  },
  serviceCharge: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return !isNaN(parseFloat(value)) && isFinite(value)
      },
      message: 'Service charge must be a valid number.',
    },
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
      'token_charge',
      'service_charge',
      'bonus_transfer',
      'commission',
      'affiliate_bonus_added',
      'affiliate_bonus_cashout',
      'product_purchase_with_affiliate_bonus',
      'id_renewal',
    ],
    required: true,
  },
  transactionRelation: {
    type: String,
    enum: [
      'user-To-user',
      'user-To-agent',
      'user-To-shop_keeper',
      'user-To-admin',
      'agent-To-agent',
      'agent-To-admin',
      'agent-To-user',
      'agent-To-shop_keeper',
      'admin-To-admin',
      'admin-To-agent',
      'shop_keeper-To-agent',
      'user-To-super_admin',
      'agent-To-super_admin',
      'shop_keeper-To-super_admin',
      'admin-To-super_admin',
      'super_admin-To-user',
      'super_admin-To-agent',
      'super_admin-To-shop_keeper',
      'super_admin-To-admin',
      'super_admin-To-super_admin',
      'shop_keeper-To-user',
      'admin-To-shop_keeper',
      'shop_keeper-To-agent',
      'user-To-shop_keeper',
    ],
  },
  affiliateBonusDetails: {
    totalBefore: Number,
    totalAfter: Number,
    cashableBefore: Number,
    cashableAfter: Number,
    forProductsBefore: Number,
    forProductsAfter: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

transactionSchema.index({ transactionRelation: 1 })

module.exports = mongoose.model('Transaction', transactionSchema)
