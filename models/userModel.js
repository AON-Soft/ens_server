const { mongoose } = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { JWT_SECRET } = require('../constant')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Enter your Name'],
    maxLength: [30, 'Name cna not excced 30 charaters'],
    minLength: [2, 'Name should have more then 2 characters long'],
  },
  email: {
    type: String,
    required: [true, 'Please Enter your Email'],
    unique: true,
    validate: [validator.isEmail, 'Please Enter a valid Email'],
  },
  mobile: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: [true, 'Please Enter your Password'],
    minLength: [6, 'Password should have more then 6 characters long'],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
  },
  bio: {
    type: String,
  },

  role: {
    type: String,
    default: 'user',
    enum: ['super_admin', 'admin', 'agent', 'user', 'shop_keeper'],
  },
  balance: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        // Validate that the value is a valid number
        return !isNaN(parseFloat(v)) && isFinite(v)
      },
      message: (props) => `${props.value} is not a valid number for balance!`,
    },
  },
  dueBalance: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        // Validate that the value is a valid number
        return !isNaN(parseFloat(v)) && isFinite(v)
      },
      message: (props) => `${props.value} is not a valid number for balance!`,
    },
  },
  bonusBalance: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        // Validate that the value is a valid number
        return !isNaN(parseFloat(v)) && isFinite(v)
      },
      message: (props) => `${props.value} is not a valid number for balance!`,
    },
  },

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'active', 'hold', 'rejected'],
  },
  fcmToken: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  directReferrals: {
    type: Number,
    default: 0,
  },
  isEarningEnabled: {
    type: Boolean,
    default: false,
  },

  lastRenewalDate: {
    type: Date,
    default: Date.now,
  },
  renewalFee: {
    type: Number,
    default: 10, // Default fee, can be adjusted by admin
  },
  affiliateBonus: {
    total: { type: Number, default: 0 },
    cashable: { type: Number, default: 0 },
    forProducts: { type: Number, default: 0 },
    lastCashoutDate: { type: Date },
  },
})

userSchema.pre('save', async function (next) {
  try {
    // Check if the password is already hashed
    if (!this.isModified('password') || this.password.startsWith('$2a$')) {
      return next()
    }

    // Hash the password
    this.password = await bcrypt.hash(this.password, 10)
    return next()
  } catch (error) {
    return next(error)
  }
})

//jwt token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '5d',
  })
}

//compare pasword
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

//Generaing Pasword Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hashing the reset token
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Setting the hashed token to the resetPasswordToken field
  this.resetPasswordToken = hashedResetToken

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000

  // Return the non-hashed token (resetToken) for email purposes
  return resetToken
}

// Add a static method to get the total number of users
userSchema.statics.getTotalUsers = async function () {
  return await this.countDocuments()
}

// Add a method to check if the user can start earning
userSchema.methods.canStartEarning = function () {
  return this.directReferrals >= 3
}

userSchema.methods.addAffiliateBonus = function (amount) {
  const bonusAdded = Math.min(amount, 1000 - this.affiliateBonus.total)
  if (bonusAdded > 0) {
    this.affiliateBonus.total += bonusAdded
    this.affiliateBonus.cashable += bonusAdded / 2
    this.affiliateBonus.forProducts += bonusAdded / 2
  }
  return bonusAdded
}

userSchema.methods.canCashoutAffiliateBonus = function () {
  if (!this.affiliateBonus.lastCashoutDate) return true
  const daysSinceLastCashout =
    (Date.now() - this.affiliateBonus.lastCashoutDate) / (1000 * 60 * 60 * 24)
  return daysSinceLastCashout >= 28
}

userSchema.methods.cashoutAffiliateBonus = function () {
  if (!this.canCashoutAffiliateBonus()) {
    throw new Error('Cannot cash out yet. Must wait 28 days between cashouts.')
  }
  const cashoutAmount = this.affiliateBonus.cashable
  this.affiliateBonus.total -= cashoutAmount
  this.affiliateBonus.cashable = 0
  this.affiliateBonus.lastCashoutDate = Date.now()
  this.balance += cashoutAmount
  return cashoutAmount
}

module.exports = mongoose.model('User', userSchema)
