const mongoose = require('mongoose')

const serviceChargeSchema = new mongoose.Schema({
  cashoutCharge: { type: Number, default: 20  },
  sendMoneyCharge: { type: Number, default: 5 },
  tokenCharge: { type: Number, default: 40 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('serviceCharges', serviceChargeSchema)
