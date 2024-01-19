const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')

const Token = require('../models/tokenModel')
const ErrorHandler = require('../utils/errorhander')

exports.createToken = catchAsyncError(async (req, _, next) => {
  const { session } = req

  const token = await Token.create({
    userId: req.user.id,
    tokenName: req.body.tokenName,
    tokenPrice: req.tokenPrice,
  })
  if (!token) {
    await session.abortTransaction()
    session.endSession()

    return next(new ErrorHandler('Token is not created.', 400))
  }

  req.token = token

  next()
})

exports.getSingleTokenDetails = catchAsyncError(async (req, res, next) => {
  const token = await Token.findById(req.params.id)
  if (!token) {
    return next(new ErrorHandler('Token is not found', 400))
  }
  res.status(200).json({ success: true, Token: token })
})

exports.getAllToken = catchAsyncError(async (req, res, next) => {
  let userId = req.user.id
  userId = new mongoose.Types.ObjectId(userId)
  const tokens = await Token.find({ userId: userId })
  if (!tokens) {
    return next(new ErrorHandler('Token is not found', 400))
  }
  res.status(200).json({ success: true, Token: tokens })
})
