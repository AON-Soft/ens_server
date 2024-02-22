const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')

const Card = require('../models/cardModel')
const Order = require('../models/orderedProductModel')

const ErrorHandler = require('../utils/errorhander')
const userModel = require('../models/userModel')

exports.placeOrder = catchAsyncError(async (req, res, next) => {
  const { address, discount, deliveryCharge, totalBill, totalCommissionBill } = req.body
  const cardID = req.params.id
  const userID = req.user.id

  const existUser = await userModel.findById(userID)

  if (!existUser) {
     next(
      new ErrorHandler(
        'User not found',
        400,
      ),
    )
  }

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
      totalCommissionBill
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

// get all pending order by shop
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

// get all confirm order by shop
exports.getAllConfirmOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  const pipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'order_confirm',
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

// get all cancel order by shop
exports.getAllOnDeliveryOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  const pipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'on_delivery',
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

// get all completed order by shop
exports.getAllDoneOrderOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  const pipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'order_done',
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

// get all cancel order by shop
exports.getAllCancelOrderOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  const pipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'canceled',
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

// get all pending order by user
exports.getAllPendingOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  const pipeline = [
    {
      $match: {
        userId: userId,
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

// get all confirm order by user
exports.getAllConfirmOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  const pipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'order_confirm',
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

// get all on delivery order by user
exports.getAllOnDeliveryOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  const pipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'on_delivery',
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

// get all completed order by user
exports.getAllDoneOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  const pipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'order_done',
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

// get all cancel order by user
exports.getAllCancelOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  const pipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'canceled',
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

// get all single order
exports.getSingleOrderDetails = catchAsyncError(async (req, res, next) => {
  const orderId = new mongoose.Types.ObjectId(req.params.id)
  const order = await Order.findById(orderId)
  if (!order) {
    next(new ErrorHandler('No Details found for this order', 400))
  }

  res.status(200).json({ success: true, order: order })
})

// delete single order
exports.deleteSingleOrder = catchAsyncError(async (req, res, next) => {
  const orderId = new mongoose.Types.ObjectId(req.params.id)
  const order = await Order.findByIdAndDelete(orderId)
  if (!order) {
    next(new ErrorHandler('No order found', 400))
  }

  res.status(200).json({ success: true, message: 'Delete success' })
})