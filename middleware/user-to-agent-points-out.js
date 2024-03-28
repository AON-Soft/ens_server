const catchAsyncError = require('./catchAsyncError.js')
const mongoose = require('mongoose')
const User = require('../models/userModel.js')
const calculateServiceCharge = require('../utils/calculateServiceCharge.js')
const uniqueTransactionID = require('../utils/transactionID.js')
const ErrorHandler = require('../utils/errorhander.js')
const serviceChargeModel = require('../models/serviceChargeModel.js')

exports.userToAgentPointsOut = catchAsyncError(async (req, res, next) => {
  const { receiverEmail, amount } = req.body;
  const transactionAmount = parseFloat(amount);

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const charge = await serviceChargeModel.findOne().session(session);

    if (!charge) {
      return next(new ErrorHandler('Service charge not found', 403))
    }

    const percentage = charge.cashoutCharge;

    // const percentage = 20;

    const sender = await User.findOne({ _id: req.user.id }).session(session)
    if (!sender) {
      await session.abortTransaction()
      session.endSession()
      return next(new ErrorHandler('Sender not found', 403))
    }
    const receiver = await User.findOne({ email: receiverEmail }).session(
      session,
    )
    if (!receiver) {
      await session.abortTransaction()
      session.endSession()
      return next(new ErrorHandler('Receiver not found', 403))
    }
    const admin = await User.findOne({ role: 'super_admin' }).session(session)
    if (!admin) {
      await session.abortTransaction()
      session.endSession()
      return next(new ErrorHandler('super_admin not found', 403))
    }

    const serviceCharge = await calculateServiceCharge(transactionAmount, percentage)
    if (sender.balance <= transactionAmount + serviceCharge) {
      return next(new ErrorHandler('Insufficient Balance', 400))
    }
    const trnxID = uniqueTransactionID()
    const pointsOutTranactionID = `PO${trnxID}`
    sender.balance -= transactionAmount + serviceCharge
    receiver.balance += transactionAmount + serviceCharge / 2
    admin.balance += serviceCharge / 2

    await sender.save({ session })
    await receiver.save({ session })
    await admin.save({ session })

    req.transactionID = pointsOutTranactionID
    req.admin = admin
    req.sender = sender
    req.receiver = receiver
    req.transactionAmount = transactionAmount
    req.serviceCharge = serviceCharge
    req.transactionType = 'points_out'
    req.paymentType = 'points'
    req.senderTransactionHeading = 'Points Out'
    req.receiverTransactionHeading = 'Points in'

    req.session = session
    next()
  } catch (error) {
    console.error(error)
    await session.abortTransaction()
    session.endSession()
    res.status(500).json({ success: false, message: 'Transaction failed' })
  }
})
