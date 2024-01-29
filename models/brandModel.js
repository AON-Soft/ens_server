const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Enter Product Name'],
    trim: true,
  },
  image: {
    public_id: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
  },
  shopCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop_categories',
    required: function () {
      return this.shopCategory === 'shopCategory'
    },
  },
  shopID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    required: function () {
      return this.shopID === 'shopID'
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('brands', brandSchema)
