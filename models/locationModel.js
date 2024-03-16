const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema({
  address_one: {
    type: String,
    required: [true, 'This field can not be empty'],
    trim: true,
  },
  address_two: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('locations', locationSchema)
