const mongoose = require('mongoose')
const crypto = require('crypto')

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  tokenName: {
    type: String,
    required: [true, 'Please Enter a Name'],
  },
  tokenPrice: {
    type: Number,
    required: [true, 'Please Enter Token Price'],
  },
  token: {
    type: String,
    unique: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
  tokenUsedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
})

tokenSchema.pre('save', function (next) {
  let tokenName = this.tokenName
  tokenName = tokenName.replace(/\s/g, '')

  if (tokenName && tokenName.length >= 3) {
    const randomToken = crypto.randomBytes(3).toString('hex')
    const firstTwoLetters = tokenName.slice(0, 2)

    this.token = `${firstTwoLetters}${randomToken}`
  } else {
    this.token = crypto.randomBytes(4).toString('hex')
  }

  next()
})

module.exports = mongoose.model('Token', tokenSchema)
