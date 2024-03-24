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
    default: null,
    required: function () {
      return !['admin', 'super_admin'].includes(this.role);
    },
  },
  shopID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    default: null,
    required: function () {
      return !['admin', 'super_admin'].includes(this.role);
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('brands', brandSchema)
