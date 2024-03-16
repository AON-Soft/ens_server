const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const Transaction = require('../models/transactionModel.js')

exports.createTransaction = catchAsyncError(async (req, res) => {
  const { session } = req

  const transaction = new Transaction({
    transactionID: req.transactionID,
    transactionAmount: req.transactionAmount,
    serviceCharge: req.serviceCharge,
    sender: {
      user: req.sender._id,
      name: req.sender.name,
      email: req.sender.email,
      flag: 'Debit',
      transactionHeading: req.senderTransactionHeading,
    },
    receiver: {
      user: req.receiver._id,
      name: req.receiver.name,
      email: req.receiver.email,
      flag: 'Credit',
      transactionHeading: req.receiverTransactionHeading,
    },
    paymentType: req.paymentType,
    transactionType: req.transactionType,
    transactionRelation: `${req.sender.role}-To-${req.receiver.role}`,
  })

  await transaction.save({ session })

  await session.commitTransaction()
  session.endSession()

  if (req.token) {
    res.status(200).json({
      success: true,
      message: 'Token created successful',
      data: req.token,
    });
  } else if (req.order) {
    res.status(200).json({
      success: true,
      message: 'Order placed successfully',
      data: req.order,
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Transaction successful',
      transaction: transaction, 
    });
  }

})

exports.transactionHistory = catchAsyncError(async (req, res) => {
  let userId = req.user.id;
  userId = new mongoose.Types.ObjectId(userId);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const resultPerPage = 10; 
  const page = req.query.page || 1; 

  const transactionPipeline = [
    {
      $match: {
        $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalUpcomingPoints: {
          $sum: {
            $cond: [
              { $eq: ['$receiver.user', userId] },
              '$transactionAmount',
              0,
            ],
          },
        },
        totalOutgoingPoints: {
          $sum: {
            $cond: [{ $eq: ['$sender.user', userId] }, '$transactionAmount', 0],
          },
        },
        transactionsHistory: {
          $push: {
            transactionID: '$transactionID',
            transactionType: '$transactionType',
            transactionAmount: '$transactionAmount',
            flag: {
              $cond: [
                { $eq: ['$sender.user', userId] },
                '$sender.flag',
                '$receiver.flag',
              ],
            },
            transactionHeading: {
              $cond: [
                { $eq: ['$sender.user', userId] },
                '$sender.transactionHeading',
                '$receiver.transactionHeading',
              ],
            },
            date: '$createdAt',
          },
        },
      },
    },
    {
      $skip: (page - 1) * resultPerPage // Skip results for pagination
    },
    {
      $limit: resultPerPage // Limit results for pagination
    }
  ];

  const transactionResult = await Transaction.aggregate(transactionPipeline);

  if (transactionResult.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No transactions found for the user in the last 6 months.',
      transactionResult,
    });
  }

  const { totalUpcomingPoints, totalOutgoingPoints, transactionsHistory } =
    transactionResult[0];

  // Count total number of transactions for the user
  const countPipeline = [
    {
      $match: {
        $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $count: 'count'
    }
  ];

  const countResult = await Transaction.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    totalUpcomingPoints,
    totalOutgoingPoints,
    transactionsHistory,
    count, 
    resultPerPage,
    filteredCount: transactionsHistory.length 
  });
});


exports.getUsersBasedOnLastPointsOut = catchAsyncError(async (_, res) => {
  const pipeline = [
    {
      $match: {
        transactionRelation: 'user-To-agent',
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: '$sender.user',
        lastTransaction: {
          $first: '$$ROOT',
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $unwind: '$userDetails',
    },
    {
      $project: {
        _id: 0,
        userId: '$userDetails._id',
        userName: '$userDetails.name',
        userEmail: '$userDetails.email',
        userAvatar: '$userDetails.avatar',
        userBalance: '$userDetails.balance',
        transactionDate: '$lastTransaction.createdAt',
        agentEmail: '$lastTransaction.receiver.email',
        agentName: '$lastTransaction.receiver.name',
      },
    },
  ]

  const result = await Transaction.aggregate(pipeline)
  console.log(result)
  res.status(200).json({ success: true, balanceHistory: result })
})

exports.earningHistory = catchAsyncError(async (req, res) => {
  let userId = req.user.id;
  userId = new mongoose.Types.ObjectId(userId);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const resultPerPage = 10; 
  const page = req.query.page || 1; 

  const earningPipeline = [
    {
      $match: {
        'receiver.user': userId,
        'receiver.flag': 'Credit',
        createdAt: { $gte: sixMonthsAgo },
        paymentType: 'bonus_points',
        $or: [
          { transactionRelation: 'user-To-user' },
          { transactionRelation: 'user-To-admin' },
          { transactionRelation: 'user-To-super_admin' }
        ]
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: {
          $sum: '$transactionAmount',
        },
        earningHistory: {
          $push: {
            transactionID: '$transactionID',
            transactionType: '$transactionType',
            transactionAmount: '$transactionAmount',
            transactionHeading: '$receiver.transactionHeading',
            date: '$createdAt',
          },
        },
      },
    },
    {
      $skip: (page - 1) * resultPerPage // Skip results for pagination
    },
    {
      $limit: resultPerPage // Limit results for pagination
    }
  ];

  const earningResult = await Transaction.aggregate(earningPipeline);

  if (earningResult.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No earnings found for the user in the last 6 months.',
      earningResult,
    });
  }

  const { totalEarnings, earningHistory } = earningResult[0];

  // Count total number of earnings for the user
  const countPipeline = [
    {
      $match: {
        'receiver.user': userId,
        'receiver.flag': 'Credit',
        createdAt: { $gte: sixMonthsAgo },
        paymentType: 'bonus_points',
        $or: [
          { transactionRelation: 'user-To-user' },
          { transactionRelation: 'user-To-admin' },
          { transactionRelation: 'user-To-super_admin' }
        ]
      },
    },
    {
      $count: 'count'
    }
  ];

  const countResult = await Transaction.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].count : 0;

  res.status(200).json({
    success: true,
    totalEarnings,
    earningHistory,
    count, 
    resultPerPage,
    filteredCount: earningHistory.length
  });
});

