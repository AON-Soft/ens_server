const uniqueTransactionID = require('../utils/transactionID')
const catchAsyncError = require('./catchAsyncError')

const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhander')
const { default: mongoose } = require('mongoose')

exports.sendPayments = catchAsyncError(async (req, _, next) => {
  const { totalBill } = req.body

  const session = await mongoose.startSession()
  session.startTransaction()

  const user = await User.findOne({ _id: req.user.id }).session(session)
  if (!user || user.balance < totalBill) {
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
  user.balance -= totalBill
  admin.balance += totalBill

  await user.save({ session })
  await admin.save({ session })

  req.tokenPrice = totalBill
  req.transactionID = generateTokenTranactionID
  req.sender = user
  req.receiver = admin
  req.transactionAmount = totalBill
  req.serviceCharge = 0
  req.transactionType = 'payment'
  req.paymentType = 'points'
  req.senderTransactionHeading = 'Order Payment Sent'
  req.receiverTransactionHeading = 'Order Payment Received'

  req.session = session

  next()
})
