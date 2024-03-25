const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const Card = require('../models/cardModel')
const Order = require('../models/orderedProductModel')
const ErrorHandler = require('../utils/errorhander')
const userModel = require('../models/userModel')
const uniqueTransactionID = require('../utils/transactionID')
const orderedProductModel = require('../models/orderedProductModel')
const ApiFeatures = require('../utils/apifeature')
const transactionModel = require('../models/transactionModel')
const shopModel = require('../models/shopModel')

exports.placeOrder = catchAsyncError(async (req, _, next) => {
  const { session } = req;
  const { address, discount, deliveryCharge, paymentStatus, totalBill, totalCommissionBill } = req.body;
  const cardID = req.params.id;
  const userID = req.user.id;

  try {
    const sender = await userModel.findById(userID).session(session);

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
    let commissionAmount = (totalCommissionBill/2)
    const shareAmount = commissionAmount / 5;

    for (let i = 0; i < 5; i++) {
      if (!existUser.parent) {
        break;
      }

      const receiver  = await userModel.findByIdAndUpdate(existUser.parent._id, { $inc: { bonusBalance: shareAmount } }, { session });
      
      commissionAmount -= shareAmount;

       const transaction = new transactionModel({
        transactionID: uniqueTransactionID(),
        transactionAmount: shareAmount,
        serviceCharge: 0,
        sender: {
          user: sender._id,
          name: sender.name,
          email: sender.email,
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
        paymentType: 'bonus_points',
        transactionRelation: `${sender.role}-To-${receiver.role}`,
      });

      await transaction.save();
      

      existUser = await userModel.findById(existUser.parent._id).session(session);
     
    }

    if (commissionAmount > 0) {
      const superAdmin = await userModel.findOne({ role: 'super_admin' }).session(session);
      if (superAdmin) {
      await userModel.findByIdAndUpdate(superAdmin._id, { $inc: { balance: commissionAmount } }, { session });
    
      const transaction = new transactionModel({
        transactionID: uniqueTransactionID(),
        transactionAmount: commissionAmount,
        serviceCharge: 0,
        sender: {
          user: sender._id,
          name: sender.name,
          email: sender.email,
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
        paymentType: 'bonus_points',
        transactionRelation: `${sender.role}-To-${superAdmin.role}`,
      });

      await transaction.save();

      commissionAmount -= shareAmount;

      }
    }

    const UniqOrderID = uniqueTransactionID();
    const generateorderID = `ORD${UniqOrderID}`;

    const data = {
      userId: card.userId,
      shopID: card.shopID,
      cardId: cardID,
      cardProducts: card.cardProducts,
      shippingAddress: address,
      orderID: generateorderID,
      discount,
      deliveryCharge,
      paymentStatus,
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

    req.order = data

    next();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorHandler('An error occurred while placing the order.', 500));
  }
});

// get all order of shop by shop
exports.getAllOrderByShop = catchAsyncError(async (req, res, next) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
   try {
    let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  };
    const count = await orderedProductModel.countDocuments({ shopID: shopId });

    const apiFeature = new ApiFeatures(
      orderedProductModel.find({ shopID: shopId })
        .populate({ path: 'userId', select: 'avatar name email' })
        .populate({ path: 'shopID', select: 'name info logo banner location address' })
        .sort({ createdAt: -1 }),
      req.query
    )
      .search()
      .filter()
      .pagination(resultPerPage);

    let result = await apiFeature.query;
    let filteredCount = result.length;

    res.status(200).json({
      success: true,
      orders: result,
      count,
      resultPerPage,
      filteredCount,
    });
  } catch (error) {
    return next(error);
  }
})

// get all order of user by user
exports.getAllOrderByUser = catchAsyncError(async (req, res, next) => {
  const userID = new mongoose.Types.ObjectId(req.user.id);
  try {
    let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  };
    const count = await orderedProductModel.countDocuments({ userId: userID });

    const apiFeature = new ApiFeatures(
      orderedProductModel.find({ userId: userID })
        .populate({ path: 'userId', select: 'avatar name email' })
        .populate({ path: 'shopID', select: 'name info logo banner location address' })
        .sort({ createdAt: -1 }),
      req.query
    )
      .search()
      .filter()
      .pagination(resultPerPage);

    let result = await apiFeature.query;
    let filteredCount = result.length;

    res.status(200).json({
      success: true,
      orders: result,
      count,
      resultPerPage,
      filteredCount,
    });
  } catch (error) {
    return next(error);
  }
});

// get all order of user by userID
exports.getAllOrderByUserId = catchAsyncError(async (req, res, next) => {
  const userID = new mongoose.Types.ObjectId(req.params.id)
  try {
    let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  };

    // total orders
    const count = await orderedProductModel.countDocuments({ userId: userID });
    // completed orders
    const completedCount = await orderedProductModel.countDocuments({ userId: userID, orderStatus: 'order_done' });
    // pending orders
    const pendingCount = await orderedProductModel.countDocuments({ userId: userID, orderStatus: 'pending' });

    const apiFeature = new ApiFeatures(
      orderedProductModel.find({ userId: userID })
        .populate({ path: 'userId', select: 'avatar name email' })
        .populate({ path: 'shopID', select: 'name info logo banner location address' })
        .sort({ createdAt: -1 }),
      req.query
    )
      .search()
      .filter()
      .pagination(resultPerPage);

    let result = await apiFeature.query;
    let filteredCount = result.length;

    res.status(200).json({
      success: true,
      data: result,
      count,
      completedCount,
      pendingCount,
      resultPerPage,
      filteredCount,
    });
  } catch (error) {
    return next(error);
  }
});

// get all order
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  try {
    let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  };
    const count = await orderedProductModel.countDocuments();

    const apiFeature = new ApiFeatures(
      orderedProductModel.find()
        .populate({ path: 'userId', select: 'avatar name email' })
        .populate({ path: 'shopID', select: 'name info logo banner location address' })
        .sort({ createdAt: -1 }),
      req.query
    )
      .search()
      .filter()
      .pagination(resultPerPage);

    let result = await apiFeature.query;
    let filteredCount = result.length;

    res.status(200).json({
      success: true,
      orders: result,
      count,
      resultPerPage,
      filteredCount,
    });
  } catch (error) {
    return next(error);
  }
  
});

// get single order
exports.getSingleOrderDetails = catchAsyncError(async (req, res, next) => {
  const orderId = new mongoose.Types.ObjectId(req.params.id)
  const order = await Order.findById(orderId)
    .populate({ path: 'userId', select: 'avatar name email' })
    .populate({ path: 'shopID', select: 'name info logo banner location address' })
    .exec()
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

    if (existOrder.orderStatus === 'canceled') {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler('Order has already been canceled.', 400));
    }

    if (orderStatus === 'canceled') {
      const updateOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: orderStatus },
        { new: true }
      ).session(session);

      const { userId, shopID, totalBill, totalCommissionBill } = existOrder;

      let user = await userModel.findOne({ _id: userId }).session(session);
      
      const receiver = await userModel.findOne({ _id: userId }).session(session);

      if (!user || user.balance < totalBill) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler('Insufficient balance.', 400));
      }

      const shop = await shopModel.findById(shopID).session(session)

      if (!shop) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler('Shop not found.', 400));
      }

      const shopKeeper = await userModel.findOne({ _id: shop.userId }).session(session);

      if (!shopKeeper) {
        await session.abortTransaction();
        session.endSession();
        return next(new ErrorHandler('Shop Keeper not found', 400));
      }

      const trnxID = uniqueTransactionID();
      const generatePaymentTranactionID = `RP${trnxID}`;
      shopKeeper.balance -= totalBill - (totalCommissionBill/2);
      user.balance += totalBill ;

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

      // get back commission from upto top 5 label generation
      let commissionAmount = (totalCommissionBill/2);
      const shareAmount = commissionAmount / 5;

      for (let i = 0; i < 5; i++) {
        if (!user.parent) {
          break;
        }

      const sender = await userModel.findByIdAndUpdate(user.parent._id, { $inc: { bonusBalance: -shareAmount } }, { session });

      commissionAmount -= shareAmount;

       const transaction = new transactionModel({
        transactionID: uniqueTransactionID(),
        transactionAmount: shareAmount,
        serviceCharge: 0,
        sender: {
          user: sender._id,
          name: sender.name,
          email: sender.email,
          flag: 'Debit',
          transactionHeading: 'Return Bonus Sent',
        },
        receiver: {
          user: receiver._id,
          name: receiver.name,
          email: receiver.email,
          flag: 'Credit',
          transactionHeading: 'Return Bonus Received',
        },
        transactionType: 'referal_bonus',
        paymentType: 'bonus_points',
        transactionRelation: `${sender.role}-To-${receiver.role}`,
      });

        await transaction.save({ session });

        user = await userModel.findById(user.parent._id).session(session);
      }

      if (commissionAmount > 0) {
        const superAdmin = await userModel.findOne({ role: 'super_admin' }).session(session);
        if (superAdmin) {
          await userModel.findByIdAndUpdate(superAdmin._id, { $inc: { bonusBalance: -commissionAmount } }, { session });
          
          const transaction = new transactionModel({
            transactionID: uniqueTransactionID(),
            transactionAmount: commissionAmount,
            serviceCharge: 0,
            sender: {
              user: superAdmin._id,
              name: superAdmin.name,
              email: superAdmin.email,
              flag: 'Debit',
              transactionHeading: 'Return Bonus Sent',
            },
            receiver: {
              user: receiver._id,
              name: receiver.name,
              email: receiver.email,
              flag: 'Credit',
              transactionHeading: 'Return Bonus Received',
            },
            transactionType: 'referal_bonus',
            paymentType: 'bonus_points',
            transactionRelation: `${superAdmin.role}-To-${receiver.role}`,
          });

        await transaction.save({ session });
        }
      }

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

      res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    next(error);
  }
});

// get all invoice
exports.getAllInvoice = catchAsyncError(async (req, res, next) => {
  try {
    let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
    const count = await orderedProductModel.countDocuments()
    const apiFeature = new ApiFeatures(
    orderedProductModel.find()
    .populate({path: 'userId', select: 'avatar name email'})
    .populate({path: 'shopID', select: 'name info logo banner location address'})
    .sort({ createdAt: -1 }),
    req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

    let invoices = await apiFeature.query
    let filteredCount = invoices.length

    res.status(200).json({
      success: true,
      data: invoices,
      count,
      resultPerPage,
      filteredCount,
    })
    } catch (error) {
      return next(error);
    }
});

// get single invoice
exports.getSingleInvoice = catchAsyncError(async (req, res, next) => {
    try {
    const order = await orderedProductModel.findById(req.params.id)
      .populate({path: 'userId', select: 'avatar name email'})
      .populate({path: 'shopID', select: 'name info logo banner location address'})
      .exec()

    if (!order) {
      next(new ErrorHandler('No order found', 400))
    }

    // Send the invoice data as response
    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    return next(error);
  }
});

// get all order by shop
exports.getAllOrderByShop = catchAsyncError(async (req, res, next) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  try {
    let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
    const count = await orderedProductModel.countDocuments({shopID : shopId})
    const apiFeature = new ApiFeatures(
    orderedProductModel.find({shopID : shopId})
    .populate({path: 'userId', select: 'avatar name email'})
    .populate({path: 'shopID', select: 'name info logo banner location address'})
    .sort({ createdAt: -1 }),
    req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

    let invoices = await apiFeature.query
    let filteredCount = invoices.length

    res.status(200).json({
      success: true,
      data: invoices,
      count,
      resultPerPage,
      filteredCount,
    })

  } catch (error) {
    return next(error);
  }
 
})

// get single invoice
exports.changePyamentStatus = catchAsyncError(async (req, res, next) => {
  const {paymentStatus} = req.body
    try {
      await orderedProductModel.findByIdAndUpdate(req.params.id, {paymentStatus}, { new: true })

      const order = await orderedProductModel.findById(req.params.id)
        .populate({path: 'userId', select: 'avatar name email'})
        .populate({path: 'shopID', select: 'name info logo banner location address'})
        .exec()

    if (!order) {
      next(new ErrorHandler('No order found', 400))
    }

    // Send the invoice data as response
    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    return next(error);
  }
});

exports.getOrderChart = catchAsyncError(async (req, res, next) => {
    const year = req.query.year;
    const nextYear = parseInt(year) + 1;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10; // Default page size

    try {
        // Find all completed orders within the specified year
        const completedOrders = await orderedProductModel.find({
            createdAt: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${nextYear}-01-01`),
            },
            orderStatus: 'order_confirm'
        });

        // Sum up the total revenue from completed orders
        const totalRevenue = completedOrders.reduce((total, order) => total + (order.totalBill || 0), 0);

        // Define the aggregation pipeline
       const queryFilter = [
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${nextYear}-01-01`),
                    },
                     orderStatus: 'order_confirm'
                },
            },
            {
                $unwind: '$cardProducts'
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    totalBill: { $sum: '$totalBill' },
                    products: {
                        $push: {
                            name: '$cardProducts.productName',
                            price: '$cardProducts.price'
                        }
                    }
                }
            }
        ];

        // Apply pagination
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        queryFilter.push({ $skip: skip }, { $limit: limit });

        // Execute the aggregation query
        const data = await orderedProductModel.aggregate(queryFilter);

        // Initialize formattedData object
        const formattedData = {};

        // Iterate over the data array
        data.forEach(item => {
            // Extract the year and month
            const year = item._id.year.toString();
            const month = item._id.month;

            // Extract month name
            const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' });

            // Check if the month already exists in formattedData
            if (!formattedData[year]) {
                formattedData[year] = [];
            }

            const existingMonth = formattedData[year].find(m => m.name === monthName);

            if (existingMonth) {
                // If the month exists, update the total bill
                existingMonth.totalBill += item.totalBill;
                existingMonth.products.push(...item.products);

            } else {
                // If the month doesn't exist, add it to formattedData
                formattedData[year].push({
                    name: monthName,
                    amount: item.totalBill,
                    products: item.products
                });
            }
        });

        // Calculate total number of pages
        const totalItems = formattedData.length;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Send the response with pagination information
        res.status(200).json({
            success: true,
            data: formattedData,
            totalRevenue,
            currentPage: page,
            pageSize,
            totalPages,
            totalItems
        });
    } catch (error) {
        // Handle errors
        next(error);
    }
});

// get all pending order by shop
exports.getAllPendingOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'pending',
      }
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all confirm order by shop
exports.getAllConfirmOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'order_confirm',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all on delivery order by shop
exports.getAllOnDeliveryOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
      resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'on_delivery',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all completed order by shop
exports.getAllDoneOrderOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'order_done',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all cancel order by shop
exports.getAllCancelOrderOrderByShop = catchAsyncError(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.shop.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        shopID: shopId,
        orderStatus: 'canceled',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all pending order by user
exports.getAllPendingOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'pending',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all confirm order by user
exports.getAllConfirmOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'order_confirm',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all on delivery order by user
exports.getAllOnDeliveryOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'on_delivery',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all completed order by user
exports.getAllDoneOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'order_done',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

// get all cancel order by user
exports.getAllCancelOrderByUser = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const page = req.query.page ? parseInt(req.query.page) : 1; 
  
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
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ]

  const result = await Order.aggregate(pipeline)
  
  const countPipeline = [
    {
      $match: {
        userId: userId,
        orderStatus: 'canceled',
      },
    },
    {
      $count: 'count',
    },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    orders: result,
    count, 
    resultPerPage,
    filteredCount: result.length 
  });
})

exports.orderSerch = catchAsyncError(async (req, res, next) => {
  const { query } = req.query;
  try {
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }

     const result = await Order.find({
      'cardProducts.productName': { $regex: query, $options: 'i' }
    })
    .populate({ path: 'userId', select: 'avatar name email' })
    .populate({ path: 'shopID', select: 'name info logo banner location address' })
    .exec();

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error)
  }
})

// get all cancel order by user
exports.getTopSellingProduct = catchAsyncError(async (req, res) => {
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }

  const page = req.query.page ? parseInt(req.query.page) : 1; 

  const pipeline = [
    {
      $unwind: "$cardProducts" 
    },
    {
      $group: {
        _id: "$cardProducts.productId",
        totalQuantitySold: { $sum: "$cardProducts.productQuantity" }
      }
    },
    {
      $lookup: {
        from: "products", 
        localField: "_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $lookup: {
        from: "users",
        localField: "productDetails.user",
        foreignField: "_id",
        as: "productDetails.user"
      }
    },
    {
      $lookup: {
        from: "shops",
        localField: "productDetails.shop",
        foreignField: "_id",
        as: "productDetails.shop"
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "productDetails.categoryId",
        foreignField: "_id",
        as: "productDetails.category"
      }
    },
    {
      $unwind: "$productDetails.user"
    },
    {
      $unwind: "$productDetails.shop"
    },
    {
      $unwind: "$productDetails.category"
    },
    {
      $project: {
        _id: "$productDetails._id",
        name: "$productDetails.name",
        description: "$productDetails.description",
        price: "$productDetails.price",
        points: "$productDetails.points",
        ratings: "$productDetails.ratings",
        images: "$productDetails.images",
        category: "$productDetails.category",
        stockUnit: "$productDetails.stockUnit",
        availableStock: "$productDetails.availableStock",
        numOfReviews: "$productDetails.numOfReviews",
        commission: "$productDetails.commission",
        user: "$productDetails.user",
        shop: "$productDetails.shop",
        reviews: "$productDetails.reviews",
        createdAt: "$productDetails.createdAt",
        __v: "$productDetails.__v",
        totalQuantitySold: 1
      }
    },
    {
      $sort: { totalQuantitySold: -1 } 
    },
    {
      $skip: (page - 1) * resultPerPage
    },
    {
      $limit: resultPerPage 
    }
  ];

  const topSellingProducts = await Order.aggregate(pipeline).exec();

  res.status(200).json({
    success: true,
    data: topSellingProducts,
    currentPage: page,
    resultPerPage
  });
});
