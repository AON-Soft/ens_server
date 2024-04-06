const mongoose = require('mongoose')

const orderBalanceSchema = new mongoose.Schema({
  amount: {
    type: Number,
  },
  commision: {
    type: Number,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orderedProducts',
    required: true,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cards',
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopKeeper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('OrderBalance', orderBalanceSchema)
