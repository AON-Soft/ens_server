const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  productName: {
    type: String,
    required: [true, 'Please Enter Product Name'],
    trim: true,
  },
  productImage: {
    type: String,
    default: '',
  },
  productQuantity: {
    type: Number,
    default: 1,
  },
  shopID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    required: function () {
      return this.shopID === 'shopID'
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('cards', cardSchema)
