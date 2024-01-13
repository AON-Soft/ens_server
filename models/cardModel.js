const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  shopID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    required: [true, 'Please Enter a Shop ID'],
  },
  cardProducts: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
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
      price: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('cards', cardSchema)
