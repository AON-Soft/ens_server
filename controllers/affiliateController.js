const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError.js')
const Transaction = require('../models/transactionModel.js')
const User = require('../models/userModel.js')
const ErrorHandler = require('../utils/errorhander.js')
const uniqueTransactionID = require('../utils/transactionID.js')
const productModel = require('../models/productModel.js')

exports.createAffiliateBonus = catchAsyncError(async (req, res, next) => {
  const { receiverEmail, amount } = req.body
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const sender = await User.findById(req.user.id).session(session)
    const receiver = await User.findOne({
      email: receiverEmail,
    }).session(session)

    if (!sender || !receiver) {
      throw new ErrorHandler('Sender or receiver not found', 404)
    }

    const transactionAmount = receiver.addAffiliateBonus(
      parseFloat(amount) || 10,
    )

    const trnxID = uniqueTransactionID()
    const transactionID = `AF${trnxID}`

    await sender.save({ session })
    await receiver.save({ session })

    const transaction = new Transaction({
      transactionID,
      transactionAmount,
      serviceCharge: 0,
      sender: {
        user: sender._id,
        name: sender.name,
        email: sender.email,
        flag: 'Debit',
        transactionHeading: 'Affiliate Bonus',
      },
      receiver: {
        user: receiver._id,
        name: receiver.name,
        email: receiver.email,
        flag: 'Credit',
        transactionHeading: 'Affiliate Bonus Received',
      },
      transactionType: 'affiliate_bonus_added',
      paymentType: 'bonus_points',
      affiliateBonusDetails: {
        totalBefore: receiver.affiliateBonus.total - transactionAmount,
        totalAfter: receiver.affiliateBonus.total,
        cashableBefore:
          receiver.affiliateBonus.cashable - transactionAmount / 2,
        cashableAfter: receiver.affiliateBonus.cashable,
        forProductsBefore:
          receiver.affiliateBonus.forProducts - transactionAmount / 2,
        forProductsAfter: receiver.affiliateBonus.forProducts,
      },
    })

    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    res.status(200).json({
      success: true,
      message: 'Transfer successful',
      transaction,
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    next(error)
  }
})

exports.cashoutAffiliateBonus = catchAsyncError(async (req, res, next) => {
  const { receiverEmail } = req.body
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const sender = await User.findById(req.user.id).session(session)
    const receiver = await User.findOne({
      email: receiverEmail,
      role: 'shop_keeper',
    }).session(session)

    if (!sender || !receiver) {
      throw new ErrorHandler('Sender or receiver not found', 404)
    }

    const transactionAmount = sender.cashoutAffiliateBonus()

    const trnxID = uniqueTransactionID()
    const transactionID = `AF${trnxID}`

    const transaction = new Transaction({
      transactionID,
      transactionAmount,
      sender: {
        user: sender._id,
        name: sender.name,
        email: sender.email,
        flag: 'Debit',
        transactionHeading: 'Points Out (Withdrawal)',
      },
      receiver: {
        user: receiver._id,
        name: receiver.name,
        email: receiver.email,
        flag: 'Credit',
        transactionHeading: 'Points In (Withdrawal)',
      },
      transactionType: 'affiliate_bonus_cashout',
      paymentType: 'bonus_points',
      affiliateBonusDetails: {
        totalBefore: sender.affiliateBonus.total + transactionAmount,
        totalAfter: sender.affiliateBonus.total,
        cashableBefore: transactionAmount,
        cashableAfter: 0,
        forProductsBefore: sender.affiliateBonus.forProducts,
        forProductsAfter: sender.affiliateBonus.forProducts,
      },
    })

    await sender.save({ session })
    await receiver.save({ session })
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    res.status(200).json({
      success: true,
      message: 'Transfer successful',
      transaction,
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    next(error)
  }
})

exports.purchaseProductWithAffiliateBonus = catchAsyncError(
  async (req, res, next) => {
    const { productId, quantity } = req.body
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const sender = await productModel.findById(productId).session(session)
      const receiver = await User.findById(req.user.id).session(session)

      if (!sender || !receiver) {
        throw new ErrorHandler('Sender or receiver not found', 404)
      }

      const transactionAmount = sender.price * quantity
      if (sender.affiliateBonus.forProducts < transactionAmount) {
        return next(
          new ErrorHandler('Insufficient affiliate bonus for products', 400),
        )
      }

      sender.affiliateBonus.total -= transactionAmount
      sender.affiliateBonus.forProducts -= transactionAmount

      const trnxID = uniqueTransactionID()
      const transactionID = `PU${trnxID}`

      const transaction = new Transaction({
        transactionID,
        transactionAmount,
        sender: {
          user: sender._id,
          name: sender.name,
          email: sender.email,
          flag: 'Debit',
          transactionHeading: 'Affiliate Bonus',
        },
        receiver: {
          user: receiver._id,
          name: receiver.name,
          email: receiver.email,
          flag: 'Credit',
          transactionHeading: 'Affiliate Bonus Received',
        },
        transactionType: 'product_purchase_with_affiliate_bonus',
        paymentType: 'bonus_points',
        affiliateBonusDetails: {
          totalBefore: sender.affiliateBonus.total + transactionAmount,
          totalAfter: sender.affiliateBonus.total,
          cashableBefore: sender.affiliateBonus.cashable,
          cashableAfter: sender.affiliateBonus.cashable,
          forProductsBefore:
            sender.affiliateBonus.forProducts + transactionAmount,
          forProductsAfter: sender.affiliateBonus.forProducts,
        },
      })

      await sender.save({ session })
      await receiver.save({ session })
      await transaction.save({ session })

      await session.commitTransaction()
      session.endSession()

      res.status(200).json({
        success: true,
        message: 'Transfer successful',
        transaction,
      })
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      next(error)
    }
  },
)
