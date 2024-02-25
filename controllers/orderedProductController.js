const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const Card = require('../models/cardModel')
const Order = require('../models/orderedProductModel')
const ErrorHandler = require('../utils/errorhander')
const userModel = require('../models/userModel')
const uniqueTransactionID = require('../utils/transactionID')

exports.placeOrder = catchAsyncError(async (req, _, next) => {
  const { session } = req;
  const { address, discount, deliveryCharge, totalBill, totalCommissionBill } = req.body;
  const cardID = req.params.id;
  const userID = req.user.id;

  try {
    let existUser = await userModel.findById(userID).session(session);

    if (!existUser) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('User not found', 400));
    }

    const userOrder = await Order.findOne({ userId: userID });

    if (!userOrder) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('Your order not found', 400));
    }

    const existOrder = await Order.findOne({ cardId: cardID });
    if (existOrder) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('You have already placed this order. Try on a new card', 400));
    }

    const card = await Card.findById(cardID);
    if (!card) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('Card not found', 400));
    }

    // give commission upto top 5 label generation
    let commissionAmount = totalCommissionBill;
    const shareAmount = commissionAmount / 5;

    for (let i = 0; i < 5; i++) {
      if (!existUser.parent) {
        break;
      }

      await userModel.findByIdAndUpdate(existUser.parent._id, { $inc: { bonusBalance: shareAmount } }, { session });

      commissionAmount -= shareAmount;

      existUser = await userModel.findById(existUser.parent._id).session(session);
    }

    if (commissionAmount > 0) {
      const superAdmin = await userModel.findOne({ role: 'super_admin' }).session(session);
      if (superAdmin) {
        await userModel.findByIdAndUpdate(superAdmin._id, { $inc: { bonusBalance: commissionAmount } }, { session });
      }
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
    };

    const order = await Order.create(data);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('Order is not created.', 400));
    }

    await Card.findByIdAndDelete(cardID);

    req.order = order

    next();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorHandler('An error occurred while placing the order.', 500));
  }
});

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

// change order status
exports.changeOrderStatus = catchAsyncError(async (req, res, next) => {
  const orderId = new mongoose.Types.ObjectId(req.params.id);
  const { orderStatus } = req.body;

  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const existOrder = await Order.findById(orderId).session(session);

    if (!existOrder) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('Order not found.', 400));
    }

    if (orderStatus === 'canceled') {
      const updateOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: orderStatus },
        { new: true }
      ).session(session);

      const { userId, totalBill } = existOrder;

      const user = await userModel.findOne({ _id: userId }).session(session);

      if (!user || user.balance < totalBill) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler('Insufficient balance.', 400));
      }

      const shopKeeper = await userModel.findById(req.user.id).session(session);

      if (!shopKeeper) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler('Shop Keeper not found', 400));
      }

      const trnxID = uniqueTransactionID();
      const generatePaymentTranactionID = `RP${trnxID}`;
      shopKeeper.balance -= totalBill;
      user.balance += totalBill;

      await user.save();
      await shopKeeper.save();

      req.transactionID = generatePaymentTranactionID;
      req.sender = shopKeeper;
      req.receiver = user;
      req.transactionAmount = totalBill;
      req.serviceCharge = 0;
      req.transactionType = 'payment';
      req.paymentType = 'points';
      req.senderTransactionHeading = 'Return Payment Sent';
      req.receiverTransactionHeading = 'Return Payment Received';

      req.session = session;
      req.order = updateOrder;

      next();
    } else {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: orderStatus },
        { new: true }
      ).session(session);

      if (!order) {
        return next(new ErrorHandler('No order found', 404));
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ success: true, message: 'Order status updated successfully', order });
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    next(error);
  }
});



