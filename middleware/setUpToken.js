const uniqueTransactionID = require('../utils/transactionID')
const catchAsyncError = require('./catchAsyncError')

const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhander')
const { default: mongoose } = require('mongoose')
const serviceChargeModel = require('../models/serviceChargeModel')

exports.setUpToken = catchAsyncError(async (req, _, next) => {
  // const tokenCharge = 40
  const session = await mongoose.startSession()
  session.startTransaction()

  const charge = await serviceChargeModel.findOne().session(session);

  if (!charge) {
    return next(new ErrorHandler('Token charge not found', 403))
  }
    
  const tokenCharge = charge.tokenCharge || 40;

  const user = await User.findOne({ _id: req.user.id }).session(session)
  if (!user || user.balance < 40) {
    await session.abortTransaction()
    session.endSession()

    return next(new ErrorHandler('Insufficient balance.', 400))
  }

  const admin = await User.findOne({ role: 'super_admin' }).session(session)

  if (!admin) {
    await session.abortTransaction()
    session.endSession()

    return next(new ErrorHandler('super_admin not found', 400))
  }

  const trnxID = uniqueTransactionID()
  const generateTokenTranactionID = `TO${trnxID}`
  user.balance -= tokenCharge
  admin.balance += tokenCharge

  await user.save({ session })
  await admin.save({ session })

  req.tokenPrice = tokenCharge
  req.transactionID = generateTokenTranactionID
  req.sender = user
  req.receiver = admin
  req.transactionAmount = tokenCharge
  req.serviceCharge = 0
  req.transactionType = 'token_charge'
  req.paymentType = 'points'
  req.senderTransactionHeading = 'Token Charge'
  req.receiverTransactionHeading = 'Token Charge'

  req.session = session

  next()
})
