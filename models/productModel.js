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
  },
  points: {
    type: Number,
    default: 0,
  },
  commission: {
    type: Number,
    required: [true, 'Please Enter Product commission'],
  },
  finalPrice: {
    type: Number,
    default: 0,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: {
    type: String,
    required: [true, 'Please Enter Image'],
  },
  categoryId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Categories',
    required: false,
  },
  brandId: {
    type: mongoose.Schema.ObjectId,
    ref: 'brands',
    required: false,
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
  status: {
    type: String,
    default: 'disable',
    enum: ['live', 'disable'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// productSchema.pre('save', function(next) {
//   this.price += this.commission;
//   next();
// });

productSchema.pre('save', function(next) {
  this.finalPrice = this.price + this.commission;
  next();
});

module.exports = mongoose.model('Products', productSchema)
