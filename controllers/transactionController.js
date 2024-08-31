const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const Transaction = require('../models/transactionModel.js')
const userModel = require('../models/userModel.js')
const createLog = require('../utils/createLogs.js')

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

  //============= super admin transaction history ==================
  if (
    (req.transactionType === 'send_points' ||
      req.transactionType === 'points_out') &&
    req.sender.role === 'user'
  ) {
    const superAdminTransaction = new Transaction({
      transactionID: req.adminTrxID,
      transactionAmount: req.serviceCharge,
      serviceCharge: req.serviceCharge,
      sender: {
        user: req.sender._id,
        name: req.sender.name,
        email: req.sender.email,
        flag: 'Debit',
        transactionHeading: req.senderTransactionHeading,
      },
      receiver: {
        user: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        flag: 'Credit',
        transactionHeading: req.receiverTransactionHeading,
      },
      paymentType: req.paymentType,
      transactionType: req.transactionType,
      transactionRelation: `${req.sender.role}-To-${req.admin.role}`,
    })
    // Save the transaction for the super admin
    await superAdminTransaction.save({ session })
  }

  await session.commitTransaction()
  session.endSession()

  if (req.token) {
    await createLog(
      `${req.sender.role}-To-${req.receiver.role}`,
      req.sender._id,
      'Create Token',
      'Token created successful',
    )
    res.status(200).json({
      success: true,
      message: 'Token created successful',
      data: req.token,
    })
  } else if (req.order) {
    await createLog(
      `${req.sender.role}-To-${req.receiver.role}`,
      req.sender._id,
      'Create Order',
      'Order created successful',
    )
    res.status(200).json({
      success: true,
      message: 'Order placed successfully',
      data: req.order,
    })
  } else {
    await createLog(
      `${req.sender.role}-To-${req.receiver.role}`,
      req.sender._id,
      req.senderTransactionHeading,
      'Transaction successful',
    )
    res.status(200).json({
      success: true,
      message: 'Transaction successful',
      transaction: transaction,
    })
  }
})

exports.transactionHistory = catchAsyncError(async (req, res) => {
  let userId = req.user.id
  userId = new mongoose.Types.ObjectId(userId)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  let resultPerPage = 10

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }
  const page = req.query.page ? parseInt(req.query.page) : 1

  const skip = (page - 1) * resultPerPage

  const keyword = req.query.keyword

  let matchStage = {}
  if (keyword && keyword.trim() !== '') {
    matchStage = {
      $match: {
        $or: [
          { 'sender.name': { $regex: keyword, $options: 'i' } },
          { 'receiver.name': { $regex: keyword, $options: 'i' } },
        ],
      },
    }
  }

  const transactionPipeline = [
    matchStage,
    {
      $match: {
        $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { senderUserId: '$sender.user', receiverUserId: '$receiver.user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', ['$$senderUserId', '$$receiverUserId']],
              },
            },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              email: 1,
              flag: 1,
              transactionHeading: 1,
            },
          },
        ],
        as: 'userInfo',
      },
    },
    {
      $addFields: {
        sender: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$sender.user'] },
              ],
            },
            '$sender',
          ],
        },
        receiver: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$receiver.user'] },
              ],
            },
            '$receiver',
          ],
        },
      },
    },
    {
      $unset: ['userInfo'],
    },
    {
      $sort: { createdAt: -1 },
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
            sender: '$sender',
            receiver: '$receiver',
            transactionRelation: '$transactionRelation',
          },
        },
      },
    },
    {
      $project: {
        totalUpcomingPoints: 1,
        totalOutgoingPoints: 1,
        transactionsHistory: {
          $slice: ['$transactionsHistory', skip, resultPerPage],
        },
      },
    },
  ]

  const filteredPipeline = transactionPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )

  const transactionResult = await Transaction.aggregate(filteredPipeline)

  if (transactionResult.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No transactions found for the user in the last 6 months.',
      transactionsHistory: transactionResult,
    })
  }

  const { totalUpcomingPoints, totalOutgoingPoints, transactionsHistory } =
    transactionResult[0]

  // Count total number of transactions
  const countPipeline = [
    matchStage,
    {
      $match: {
        $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
      },
    },
    {
      $count: 'count',
    },
  ]

  const filteredCountPipeline = countPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )
  const countResult = await Transaction.aggregate(filteredCountPipeline)
  const count = countResult.length > 0 ? countResult[0].count : 0

  res.status(200).json({
    success: true,
    totalUpcomingPoints,
    totalOutgoingPoints,
    transactionsHistory,
    count,
    resultPerPage,
    currentPage: page,
    totalPages: Math.ceil(count / resultPerPage),
    filteredCount: transactionsHistory.length,
  })
})

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
  const userId = new mongoose.Types.ObjectId(req.user.id)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  let resultPerPage = 10

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }

  const page = req.query.page ? parseInt(req.query.page) : 1
  const skip = (page - 1) * resultPerPage
  const keyword = req.query.keyword

  let matchStage = {}
  if (keyword && keyword.trim() !== '') {
    matchStage = {
      $match: {
        $or: [
          { 'sender.name': { $regex: keyword, $options: 'i' } },
          { 'receiver.name': { $regex: keyword, $options: 'i' } },
        ],
      },
    }
  }

  const earningPipeline = [
    matchStage,
    {
      $match: {
        'receiver.user': userId,
        'receiver.flag': 'Credit',
        createdAt: { $gte: sixMonthsAgo },
        paymentType: 'bonus_points',
        $or: [
          { transactionRelation: 'user-To-user' },
          { transactionRelation: 'user-To-admin' },
          { transactionRelation: 'user-To-super_admin' },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'sender.user',
        foreignField: '_id',
        as: 'senderInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'receiver.user',
        foreignField: '_id',
        as: 'receiverInfo',
      },
    },
    {
      $addFields: {
        sender: { $arrayElemAt: ['$senderInfo', 0] },
        receiver: { $arrayElemAt: ['$receiverInfo', 0] },
      },
    },
    {
      $unset: [
        'senderInfo',
        'receiverInfo',
        'sender.password',
        'receiver.password',
      ],
    },
    {
      $sort: { createdAt: -1 },
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
            sender: {
              name: '$sender.name',
              email: '$sender.email',
              mobile: '$sender.mobile',
              avatar: '$sender.avatar',
              balance: '$sender.balance',
              dueBalance: '$sender.dueBalance',
            },
            receiver: {
              name: '$receiver.name',
              email: '$receiver.email',
              mobile: '$receiver.mobile',
              avatar: '$receiver.avatar',
              balance: '$receiver.balance',
              dueBalance: '$receiver.dueBalance',
            },
          },
        },
      },
    },
    {
      $project: {
        totalEarnings: 1,
        earningHistory: { $slice: ['$earningHistory', skip, resultPerPage] },
      },
    },
  ]

  const filteredPipeline = earningPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )
  const earningResult = await Transaction.aggregate(filteredPipeline)

  if (earningResult.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No earnings found for the user in the last 6 months.',
      earningHistory: earningResult,
    })
  }

  const { totalEarnings, earningHistory } = earningResult[0]

  // Count total number of earnings
  const countPipeline = [
    matchStage,
    {
      $match: {
        'receiver.user': userId,
        'receiver.flag': 'Credit',
        createdAt: { $gte: sixMonthsAgo },
        paymentType: 'bonus_points',
        $or: [
          { transactionRelation: 'user-To-user' },
          { transactionRelation: 'user-To-admin' },
          { transactionRelation: 'user-To-super_admin' },
        ],
      },
    },
    {
      $count: 'count',
    },
  ]

  const filteredCountPipeline = countPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )
  const countResult = await Transaction.aggregate(filteredCountPipeline)
  const count = countResult.length > 0 ? countResult[0].count : 0

  res.status(200).json({
    success: true,
    totalEarnings,
    earningHistory,
    count,
    resultPerPage,
    filteredCount: earningHistory.length,
  })
})

exports.transactionHistoryByUserId = catchAsyncError(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.params.id)

  let resultPerPage = 10

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }
  const page = req.query.page ? parseInt(req.query.page) : 1

  const skip = (page - 1) * resultPerPage

  const keyword = req.query.keyword

  let matchStage = {}
  if (keyword && keyword.trim() !== '') {
    matchStage = {
      $match: {
        $or: [
          { 'sender.name': { $regex: keyword, $options: 'i' } },
          { 'receiver.name': { $regex: keyword, $options: 'i' } },
        ],
      },
    }
  }

  const transactionPipeline = [
    matchStage,
    {
      $match: {
        $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { senderUserId: '$sender.user', receiverUserId: '$receiver.user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', ['$$senderUserId', '$$receiverUserId']],
              },
            },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              email: 1,
              flag: 1,
              transactionHeading: 1,
            },
          },
        ],
        as: 'userInfo',
      },
    },
    {
      $addFields: {
        sender: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$sender.user'] },
              ],
            },
            '$sender',
          ],
        },
        receiver: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$receiver.user'] },
              ],
            },
            '$receiver',
          ],
        },
      },
    },
    {
      $unset: ['userInfo'],
    },
    {
      $sort: { createdAt: -1 },
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
            sender: '$sender',
            receiver: '$receiver',
            transactionRelation: '$transactionRelation',
          },
        },
      },
    },
    {
      $project: {
        totalUpcomingPoints: 1,
        totalOutgoingPoints: 1,
        transactionsHistory: {
          $slice: ['$transactionsHistory', skip, resultPerPage],
        },
      },
    },
  ]

  const filteredPipeline = transactionPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )

  const transactionResult = await Transaction.aggregate(filteredPipeline)

  if (transactionResult.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No transactions found for the user in the last 6 months.',
      transactionsHistory: transactionResult,
    })
  }

  const { totalUpcomingPoints, totalOutgoingPoints, transactionsHistory } =
    transactionResult[0]

  // Count total number of transactions
  const countPipeline = [
    matchStage,
    {
      $match: {
        $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
      },
    },
    {
      $count: 'count',
    },
  ]

  const filteredCountPipeline = countPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )
  const countResult = await Transaction.aggregate(filteredCountPipeline)
  const count = countResult.length > 0 ? countResult[0].count : 0

  res.status(200).json({
    success: true,
    totalUpcomingPoints,
    totalOutgoingPoints,
    transactionsHistory,
    count,
    resultPerPage,
    currentPage: page,
    totalPages: Math.ceil(count / resultPerPage),
    filteredCount: transactionsHistory.length,
  })
})

exports.allTransactionHistory = catchAsyncError(async (req, res) => {
  let resultPerPage = 10

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }

  const page = req.query.page ? parseInt(req.query.page) : 1

  const skip = (page - 1) * resultPerPage

  const keyword = req.query.keyword

  let matchStage = {}
  if (keyword && keyword.trim() !== '') {
    matchStage = {
      $match: {
        $or: [
          { 'sender.name': { $regex: keyword, $options: 'i' } },
          { 'receiver.name': { $regex: keyword, $options: 'i' } },
        ],
      },
    }
  }

  //  transaction pipeline
  const transactionPipeline = [
    matchStage,
    {
      $lookup: {
        from: 'users',
        let: { senderUserId: '$sender.user', receiverUserId: '$receiver.user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', ['$$senderUserId', '$$receiverUserId']],
              },
            },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              email: 1,
              flag: 1,
              transactionHeading: 1,
            },
          },
        ],
        as: 'userInfo',
      },
    },
    {
      $addFields: {
        sender: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$sender.user'] },
              ],
            },
            '$sender',
          ],
        },
        receiver: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$receiver.user'] },
              ],
            },
            '$receiver',
          ],
        },
      },
    },
    {
      $unset: ['userInfo'],
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: null,
        totalUpcomingPoints: {
          $sum: '$transactionAmount',
        },
        totalOutgoingPoints: {
          $sum: '$transactionAmount',
        },
        transactionsHistory: {
          $push: {
            transactionID: '$transactionID',
            transactionType: '$transactionType',
            transactionAmount: '$transactionAmount',
            flag: '$sender.flag', // Assuming sender flag is used for both incoming and outgoing transactions
            transactionHeading: '$sender.transactionHeading', // Assuming sender transaction heading is used for both incoming and outgoing transactions
            date: '$createdAt',
            sender: '$sender',
            receiver: '$receiver',
            transactionRelation: '$transactionRelation',
          },
        },
      },
    },
    {
      $project: {
        totalUpcomingPoints: 1,
        totalOutgoingPoints: 1,
        transactionsHistory: {
          $slice: ['$transactionsHistory', skip, resultPerPage],
        },
      },
    },
  ]

  const filteredPipeline = transactionPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )

  const transactionResult = await Transaction.aggregate(filteredPipeline)

  if (transactionResult.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No transactions found for the user in the last 6 months.',
      transactionsHistory: transactionResult,
    })
  }

  const { totalUpcomingPoints, totalOutgoingPoints, transactionsHistory } =
    transactionResult[0]

  // Count total number of transactions
  const countPipeline = [
    matchStage,
    {
      $count: 'count',
    },
  ]

  const filteredCountPipeline = countPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )

  const countResult = await Transaction.aggregate(filteredCountPipeline)
  const count = countResult.length > 0 ? countResult[0].count : 0

  res.status(200).json({
    success: true,
    totalUpcomingPoints,
    totalOutgoingPoints,
    transactionsHistory,
    count,
    resultPerPage,
    currentPage: page,
    totalPages: Math.ceil(count / resultPerPage),
    filteredCount: transactionsHistory.length,
  })
})

exports.earningHistoryByAdmin = catchAsyncError(async (req, res) => {
  const superAdmin = await userModel.findOne({ role: 'super_admin' }).exec()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  let resultPerPage = 10

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }

  const page = req.query.page ? parseInt(req.query.page) : 1
  const skip = (page - 1) * resultPerPage
  const keyword = req.query.keyword
  const senderRole = req.query.sender_role

  let matchStage = {}
  if (keyword && keyword.trim() !== '') {
    matchStage = {
      $match: {
        $or: [
          { 'sender.name': { $regex: keyword, $options: 'i' } },
          { 'receiver.name': { $regex: keyword, $options: 'i' } },
        ],
      },
    }
  }

  let matchRoleStage = {}
  if (senderRole !== 'all') {
    matchRoleStage = {
      $match: {
        'sender.role': senderRole,
      },
    }
  }

  const earningPipeline = [
    matchStage,
    {
      $match: {
        'receiver.user': superAdmin._id,
        'receiver.flag': 'Credit',
        // $or: [
        //   { paymentType: 'points' },
        //   { paymentType: 'bonus_points' },
        //   { transactionType: 'points_in'},
        //   { transactionType: 'payment'},
        //   { transactionType: 'send_points'},
        //   { transactionType: 'points_out'},
        //   { transactionType: 'referal_bonus'},
        //   { transactionType: 'received_bonus'},
        //   { transactionType: 'token_charge'},
        //   { transactionRelation: 'user-To-super_admin' },
        //   { transactionRelation: 'agent-To-super_admin' },
        //   { transactionRelation: 'admin-To-super_admin' },
        // ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'sender.user',
        foreignField: '_id',
        as: 'senderInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'receiver.user',
        foreignField: '_id',
        as: 'receiverInfo',
      },
    },
    {
      $addFields: {
        sender: { $arrayElemAt: ['$senderInfo', 0] },
        receiver: { $arrayElemAt: ['$receiverInfo', 0] },
      },
    },
    {
      $unset: [
        'senderInfo',
        'receiverInfo',
        'sender.password',
        'receiver.password',
      ],
    },
    matchRoleStage,
    {
      $sort: { createdAt: -1 },
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
            sender: {
              name: '$sender.name',
              email: '$sender.email',
              mobile: '$sender.mobile',
              avatar: '$sender.avatar',
              balance: '$sender.balance',
              dueBalance: '$sender.dueBalance',
            },
            receiver: {
              name: '$receiver.name',
              email: '$receiver.email',
              mobile: '$receiver.mobile',
              avatar: '$receiver.avatar',
              balance: '$receiver.balance',
              dueBalance: '$receiver.dueBalance',
            },
          },
        },
      },
    },
    {
      $project: {
        totalEarnings: 1,
        earningHistory: { $slice: ['$earningHistory', skip, resultPerPage] },
        totalCount: { $size: '$earningHistory' },
      },
    },
  ]

  const filteredPipeline = earningPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )
  const earningResult = await Transaction.aggregate(filteredPipeline)

  if (earningResult.length === 0) {
    return res.status(200).json({
      success: false,
      message: 'No earnings found for the user in the last 6 months.',
      earningHistory: earningResult,
    })
  }

  const { totalEarnings, earningHistory, totalCount } = earningResult[0]

  // Count total number of earnings
  // const countPipeline = [
  //   matchStage,
  //   {
  //     $match: {
  //       'receiver.user': superAdmin._id,
  //       'receiver.flag': 'Credit',
  //       // $or: [
  //       //   { paymentType: 'points' },
  //       //   { paymentType: 'bonus_points' },
  //       //   { transactionType: 'payment'},
  //       //   { transactionType: 'points_in'},
  //       //   { transactionType: 'send_points'},
  //       //   { transactionType: 'points_out'},
  //       //   { transactionType: 'referal_bonus'},
  //       //   { transactionType: 'received_bonus'},
  //       //   { transactionType: 'token_charge'},
  //       //   { transactionRelation: 'user-To-super_admin' },
  //       //   { transactionRelation: 'agent-To-super_admin' },
  //       //   { transactionRelation: 'admin-To-super_admin' },
  //       // ],
  //     },
  //   },
  //   {
  //     $count: 'count',
  //   },
  // ]

  // const filteredCountPipeline = countPipeline.filter(
  //   (stage) => Object.keys(stage).length > 0,
  // )
  // const countResult = await Transaction.aggregate(filteredCountPipeline)
  // const count = countResult.length > 0 ? countResult[0].count : 0

  res.status(200).json({
    success: true,
    totalEarnings,
    earningHistory,
    count: totalCount,
    resultPerPage,
    filteredCount: earningHistory.length,
  })
})

exports.pointOutHistory = catchAsyncError(async (req, res) => {
  let userId = req.user.id
  userId = new mongoose.Types.ObjectId(userId)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  let resultPerPage = 10

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }
  const page = req.query.page ? parseInt(req.query.page) : 1

  const skip = (page - 1) * resultPerPage

  const keyword = req.query.keyword

  let matchStage = {}
  if (keyword && keyword.trim() !== '') {
    matchStage = {
      $match: {
        $or: [
          { 'sender.name': { $regex: keyword, $options: 'i' } },
          { 'receiver.name': { $regex: keyword, $options: 'i' } },
        ],
      },
    }
  }

  const transactionPipeline = [
    matchStage,
    {
      $match: {
        $and: [
          { $or: [{ 'sender.user': userId }, { 'receiver.user': userId }] },
          { transactionType: 'points_out' },
          { paymentType: 'points' },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { senderUserId: '$sender.user', receiverUserId: '$receiver.user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', ['$$senderUserId', '$$receiverUserId']],
              },
            },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              email: 1,
              flag: 1,
              transactionHeading: 1,
            },
          },
        ],
        as: 'userInfo',
      },
    },
    {
      $addFields: {
        sender: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$sender.user'] },
              ],
            },
            '$sender',
          ],
        },
        receiver: {
          $mergeObjects: [
            {
              $arrayElemAt: [
                '$userInfo',
                { $indexOfArray: ['$userInfo._id', '$receiver.user'] },
              ],
            },
            '$receiver',
          ],
        },
      },
    },
    {
      $unset: ['userInfo'],
    },
    {
      $sort: { createdAt: -1 },
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
            sender: '$sender',
            receiver: '$receiver',
            transactionRelation: '$transactionRelation',
          },
        },
      },
    },
    {
      $project: {
        totalUpcomingPoints: 1,
        totalOutgoingPoints: 1,
        transactionsHistory: {
          $slice: ['$transactionsHistory', skip, resultPerPage],
        },
      },
    },
  ]

  const filteredPipeline = transactionPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )

  const transactionResult = await Transaction.aggregate(filteredPipeline)

  if (transactionResult.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No transactions found for the user in the last 6 months.',
      transactionsHistory: transactionResult,
    })
  }

  const { totalUpcomingPoints, totalOutgoingPoints, transactionsHistory } =
    transactionResult[0]

  // Count total number of transactions
  const countPipeline = [
    matchStage,
    {
      $match: {
        $and: [
          { $or: [{ 'sender.user': userId }, { 'receiver.user': userId }] },
          { transactionType: 'points_out' },
          { paymentType: 'points' },
        ],
      },
    },
    {
      $count: 'count',
    },
  ]

  const filteredCountPipeline = countPipeline.filter(
    (stage) => Object.keys(stage).length > 0,
  )
  const countResult = await Transaction.aggregate(filteredCountPipeline)
  const count = countResult.length > 0 ? countResult[0].count : 0

  res.status(200).json({
    success: true,
    totalUpcomingPoints,
    totalOutgoingPoints,
    transactionsHistory,
    count,
    resultPerPage,
    currentPage: page,
    totalPages: Math.ceil(count / resultPerPage),
    filteredCount: transactionsHistory.length,
  })
})
