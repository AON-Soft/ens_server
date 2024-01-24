const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')

const Card = require('../models/cardModel')
const Order = require('../models/orderedProductModel')

const ErrorHandler = require('../utils/errorhander')

exports.placeOrder = catchAsyncError(async (req, res, next) => {
  const { address, discount, deliveryCharge, totalBill } = req.body
  const cardID = req.params.id

  const existOrder = await Order.findOne({ cardId: cardID })
  if (existOrder) {
    next(
      new ErrorHandler(
        'You have already placed this order. Try on new card',
        400,
      ),
    )
  } else {
    const card = await Card.findById(cardID)
    if (!card) {
      next(new ErrorHandler('card not found', 400))
    }

    const data = {
      userId: card.userId,
      shopID: card.shopID,
      cardId: cardID,
      cardProducts: card.cardProducts,
      shippingAddress: address,
      discount,
      deliveryCharge,
      totalBill,
    }
    const order = await Order.create(data)
    if (!order) {
      return next(new ErrorHandler('order is not created.', 400))
    }

    await Card.findByIdAndDelete(cardID)

    const orderWithout__v = order.toObject()
    delete orderWithout__v.__v

    res.status(201).json({ success: true, order: orderWithout__v })
  }
})

exports.getAllPendingOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  const pipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'pending',
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $unwind: '$userDetails',
    },
    {
      $project: {
        name: '$userDetails.name',
        email: '$userDetails.email',
        avatar: '$userDetails.avatar',
        orderId: '$_id',
        orderStatus: 1,
        totalBill: 1,
      },
    },
  ]

  const result = await Order.aggregate(pipeline)
  res.status(200).json({ success: true, orders: result })
})

exports.getSingleOrderDetails = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    next(new ErrorHandler('No Details found for this order', 400))
  }

  res.status(200).json({ success: true, order: order })
})
