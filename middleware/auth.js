const ErrorHander = require('../utils/errorhander')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const Shop = require('../models/shopModel')
const catchAsyncError = require('./catchAsyncError')
const { JWT_SECRET } = require('../constant')
const { default: mongoose } = require('mongoose')

// Universal Authentication Middleware
exports.isAuthenticated = catchAsyncError(async (req, _, next) => {
  //   const { token } = req.cookies;
  const authHeader = req.headers['authorization']

  if (typeof authHeader === 'undefined') {
    return next(new ErrorHander('un-authorized', 401))
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return next(new ErrorHander('Please Login to access this resource', 401))
  }
  const secret = JWT_SECRET
  const decodedData = jwt.verify(token, secret)
  req.user = decodedData
  next()
})

exports.isAuthenticatedShop = catchAsyncError(async (req, _, next) => {
  const getShop = await Shop.findOne({
    createdBy: new mongoose.Types.ObjectId(req.user.id),
  })
  if (!getShop) {
    return next(new ErrorHander('Shop not found', 404))
  }
  req.shop = getShop
  next()
})

exports.isAuthenticatedUserTemp = catchAsyncError(async (req, _, next) => {
  const authHeader = req.headers['authorization']

  if (typeof authHeader === 'undefined') {
    return next(new ErrorHander('Authorization Header is Undefined', 401))
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return next(
      new ErrorHander(
        'Please register first Or Your Cookies is not working',
        401,
      ),
    )
  }
  const secret = JWT_SECRET
  const decodedData = jwt.verify(token, secret)
  req.user = decodedData
  next()
})

exports.isAuthenticatedUser = catchAsyncError(async (req, _, next) => {
  //   const { token } = req.cookies;
  const authHeader = req.headers['authorization']

  if (typeof authHeader === 'undefined') {
    return next(new ErrorHander('Authorization Header is Undefined', 401))
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return next(new ErrorHander('Please Login to access this resource', 401))
  }
  const secret = process.env.JWT_SECRET || 'fjhhIOHfjkflsjagju0fujljldfgl'
  const decodedData = jwt.verify(token, secret)

  req.user = await User.findById(decodedData.id)

  next()
})

exports.isAuthorizeRoles = (...roles) => {
  return (req, _, next) => {
    roles.forEach((role) => {
      if (!role.includes(req.user.role)) {
        return next(
          new ErrorHander(
            `Role: ${req.user.role} is not allowed to access this resource`,
            403,
          ),
        )
      }
    })

    next()
  }
}
