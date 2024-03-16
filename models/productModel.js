const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Enter Product Name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please Enter Product Description'],
  },
  price: {
    type: Number,
    required: [true, 'Please Enter Product Price'],
    maxLength: [8, "Price can't exceed 8 Characters"],
  },
  points: {
    type: Number,
    required: [true, 'Please Enter Product Price'],
    maxLength: [8, "Price can't exceed 8 Characters"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: {
    url: String
  },
  categoryId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Categories',
  },
  stockUnit: {
    type: String,
    enum: ['pieces', 'boxes', 'liters', 'grams', 'kilograms'],
    required: [true, 'Please Enter Stock Unit'],
  },
  availableStock: {
    type: Number,
    required: function () {
      return this.stockType === 'stockAsQuantity';
    },
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        default: 0,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  commission: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  shop: {
    type: mongoose.Schema.ObjectId,
    ref: 'shop',
    required: true,
  },
  tags: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
  }],
  unit: {
    type: mongoose.Schema.ObjectId,
    ref: 'Unit',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Products', productSchema)
