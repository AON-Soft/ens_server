const mongoose = require('mongoose')

const orderedProductsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  shopID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    required: [true, 'Please Enter a Shop ID'],
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cards',
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
      commission: {
        type: Number,
        default: 0,
      },
      totalCommission: {
        type: Number,
        default: 0,
      },
    },
  ],
  discount: {
    type: Number,
  },
  deliveryCharge: {
    type: Number,
  },
  totalBill: {
    type: Number,
  },
  totalCommissionBill: {
    type: Number,
  },
  orderStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'order_confirm', 'on_delivery', 'order_done', 'canceled'],
  },
  paymentStatus: {
    type: String,
    default: 'unpaid',
    enum: ['paid', 'unpaid'],
  },
  vat: {
    type: Number,
    default: 0,
  },
  shippingAddress: {
    type: String,
    required: [true, 'Please Enter Adress'],
  },
  orderID: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('orderedProducts', orderedProductsSchema)
