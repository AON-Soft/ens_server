const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please Enter Title'],
    trim: true,
  },
  subtitle: {
    type: String,
    required: [true, 'Please Enter Sub-Title'],
    trim: true,
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
