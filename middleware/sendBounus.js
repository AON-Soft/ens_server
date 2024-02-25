const uniqueTransactionID = require('../utils/transactionID')
const catchAsyncError = require('./catchAsyncError')

const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhander')
const { default: mongoose } = require('mongoose')
const cardModel = require('../models/cardModel')
const shopModel = require('../models/shopModel')
const transactionModel = require('../models/transactionModel')


exports.sendBonus = catchAsyncError(async (req, _, next) => {
  const { totalCommissionBill } = req.body;
  const cardID = req.params.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  const user = await User.findOne({ _id: req.user.id }).session(session);
  if(!user){
    session.abortTransaction();
    session.endSession();
     return next(new ErrorHandler('Insufficient balance.', 400))
  }

  try {
    let receiver = await User.findOne({ _id: req.user.id }).session(session);
  
    if (!receiver) {
      throw new ErrorHandler('Insufficient balance.', 400);
    }
  
    const admin = await User.findOne({ role: 'super_admin' }).session(session);
  
    if (!admin) {
      throw new ErrorHandler('Super admin not found', 400);
    }
  
    const card = await cardModel.findById(cardID).session(session);
    
    if (!card) {
      throw new ErrorHandler('Card not found', 400);
    }
  
    const shop = await shopModel.findById(card.shopID).session(session);
  
    if (!shop) {
      throw new ErrorHandler('Shop not found', 400);
    }
  
    const shopKeeper = await User.findById(shop.userId).session(session);
  
    if (!shopKeeper) {
      throw new ErrorHandler('Shop Keeper not found', 400);
    }
  
    shopKeeper.balance -= totalCommissionBill

    let commissionAmount = totalCommissionBill;
  
    for (let i = 0; i < 5; i++) {
      if (!receiver.parent) {
        break;
      }
  
      const shareAmount = commissionAmount / 5;
  
      await User.findByIdAndUpdate(user.parent._id, { $inc: { bonusBalance: shareAmount } }, { session });
  
      commissionAmount -= shareAmount;
  
      receiver = await User.findById(user.parent._id).session(session);

      // Create and save transaction data for each transfer
      const transaction = new transactionModel({
        transactionID: uniqueTransactionID(),
        transactionAmount: shareAmount,
        serviceCharge: 0,
        sender: {
          user: user._id,
          name: user.name,
          email: user.email,
          flag: 'Debit',
          transactionHeading: 'Referral Bonus Sent',
        },
        receiver: {
          user: receiver._id,
          name: receiver.name,
          email: receiver.email,
          flag: 'Credit',
          transactionHeading: 'Referral Bonus Received',
        },
        transactionType: 'referal_bonus',
        paymentType: 'points',
        transactionRelation: `${user.role}-To-${receiver.role}`,
      });

      await transaction.save({ session });
    }
  
    if (commissionAmount > 0) {
      const superAdmin = await User.findOne({ role: 'super_admin' }).session(session);
      if (superAdmin) {
        await User.findByIdAndUpdate(superAdmin._id, { $inc: { bonusBalance: commissionAmount } }, { session });
      }
       // Create and save transaction data for each transfer
      const transaction = new transactionModel({
        transactionID: uniqueTransactionID(),
        transactionAmount: commissionAmount,
        serviceCharge: 0,
        sender: {
          user: user._id,
          name: user.name,
          email: user.email,
          flag: 'Debit',
          transactionHeading: 'Referral Bonus Sent',
        },
        receiver: {
          user: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          flag: 'Credit',
          transactionHeading: 'Referral Bonus Received',
        },
        transactionType: 'referal_bonus',
        paymentType: 'points',
        transactionRelation: `${user.role}-To-${superAdmin.role}`,
      });
      await transaction.save({ session });
    }
  
    await user.save({ session });
    await shopKeeper.save({ session });
  
    next();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});



  // req.transactionID = generatePaymentTranactionID
  // req.sender = user
  // req.receiver = shopKeeper
  // req.transactionAmount = totalCommissionBill
  // req.serviceCharge = 0
  // req.transactionType = 'referal_bonus'
  // req.paymentType = 'points'
  // req.senderTransactionHeading = 'Referel Bonus Sent'
  // req.receiverTransactionHeading = 'Referel Bonus Received'

  // req.session = session