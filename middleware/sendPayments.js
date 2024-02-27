const uniqueTransactionID = require('../utils/transactionID')
const catchAsyncError = require('./catchAsyncError')

const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhander')
const { default: mongoose } = require('mongoose')
const shopModel = require('../models/shopModel')
const cardModel = require('../models/cardModel')

exports.sendPayments = catchAsyncError(async (req, _, next) => {
  const { totalBill, totalCommissionBill } = req.body
  const cardID = req.params.id;

  const session = await mongoose.startSession()
  session.startTransaction()

  const user = await User.findOne({ _id: req.user.id }).session(session)
 
  if (!user || user.balance < totalBill) {
    await session.abortTransaction()
    session.endSession()

    return next(new ErrorHandler('Insufficient balance.', 400))
  }

  const card = await cardModel.findById(cardID).session(session);
  
  if (!card) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorHandler('Card not found', 400));
  }

  const shop = await shopModel.findById(card.shopID).session(session);

  if (!shop) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorHandler('shop not found', 400));
  }

  const shopKeeper = await User.findById(shop.userId).session(session);

  if (!shopKeeper) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorHandler('Shop Keeper not found', 400));
  }

  // const admin = await User.findOne({ role: 'super_admin' }).session(session)

  // if (!admin) {
  //   await session.abortTransaction()
  //   session.endSession()

  //   return next(new ErrorHandler('super_admin not found', 400))
  // }
  
  const trnxID = uniqueTransactionID()
  const generatePaymentTranactionID = `OP${trnxID}`
  user.balance -= totalBill
  shopKeeper.balance += totalBill - (totalCommissionBill/2)

  await user.save({ session })
  await shopKeeper.save({ session })

  req.transactionID = generatePaymentTranactionID
  req.sender = user
  req.receiver = shopKeeper
  req.transactionAmount = totalBill - (totalCommissionBill/2)
  req.serviceCharge = 0
  req.transactionType = 'payment'
  req.paymentType = 'points'
  req.senderTransactionHeading = 'Order Payment Sent'
  req.receiverTransactionHeading = 'Order Payment Received'

  req.session = session

  next()
})
