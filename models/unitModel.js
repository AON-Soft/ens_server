const mongoose = require('mongoose')

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Enter Unit Name'],
    trim: true,
    unique: true,
  },
  abbreviation: {
    type: String,
    required: [true, 'Please Enter Unit Abbreviation'],
    trim: true,
    unique: true,
    enum: ['kg', 'g', 'm', 'cm', 'L', 'ml'], 
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

module.exports = mongoose.model('Unit', unitSchema)
