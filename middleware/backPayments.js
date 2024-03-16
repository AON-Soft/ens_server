const uniqueTransactionID = require('../utils/transactionID')
const catchAsyncError = require('./catchAsyncError')

const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhander')
const { default: mongoose } = require('mongoose')
const orderedProductModel = require('../models/orderedProductModel')

exports.backPayments = catchAsyncError(async (req, _, next) => {
  const orderId = new mongoose.Types.ObjectId(req.params.id)

  const session = await mongoose.startSession()
  session.startTransaction()

  const order = await orderedProductModel.findById(orderId).session(session);

  if (!order) {
    await session.abortTransaction()
    session.endSession()

    return next(new ErrorHandler('Nrder not found.', 400))
  }

  const {userId, totalBill, totalCommissionBill} = order

  const user = await User.findOne({ _id: userId}).session(session)
 
  if (!user || user.balance < totalBill) {
    await session.abortTransaction()
    session.endSession()

    return next(new ErrorHandler('Insufficient balance.', 400))
  }


  const shopKeeper = await User.findById(req.user.id).session(session);

  if (!shopKeeper) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorHandler('Shop Keeper not found', 400));
  }


  const trnxID = uniqueTransactionID()
  const generatePaymentTranactionID = `OP${trnxID}`
  user.balance -= totalBill
  shopKeeper.balance += totalBill - totalCommissionBill

  await user.save({ session })
  await shopKeeper.save({ session })

  req.transactionID = generatePaymentTranactionID
  req.sender = user
  req.receiver = shopKeeper
  req.transactionAmount = totalBill - totalCommissionBill
  req.serviceCharge = 0
  req.transactionType = 'payment'
  req.paymentType = 'points'
  req.senderTransactionHeading = 'Order Payment Sent'
  req.receiverTransactionHeading = 'Order Payment Received'

  req.session = session

  next()
})
