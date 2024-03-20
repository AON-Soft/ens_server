const mongoose = require('mongoose')

const serviceChargeSchema = new mongoose.Schema({
  cashoutCharge: {
    name: { type: String, required: true },
    amount: { type: Number, default: 20  },
  },
  sendMoneyCharge: {
    name: { type: String, required: true },
    amount: { type: Number, default: 5 },
  },
  tokenCharge: {
    name: { type: String, required: true },
    amount: { type: Number, default: 40 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('serviceCharges', serviceChargeSchema)
