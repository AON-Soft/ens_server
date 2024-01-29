const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const shopSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: [true, 'Please Enter Shop Name'],
    maxLength: [30, 'Name cna not excced 30 charaters'],
    minLength: [2, 'Name should have more then 2 characters long'],
  },
  info: {
    type: String,
  },
  logo: {
    public_id: {
      type: String,
      required: true,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
  },
  banner: {
    public_id: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop_categories',
    required: [true, 'Select a Category of your Shop'],
  },
  address: {
    type: String,
    required: [true, 'Enter a Address of your Shop'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
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

shopSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

module.exports = mongoose.model('shop', shopSchema)
