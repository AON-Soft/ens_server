const catchAsyncError = require('../middleware/catchAsyncError')

const Transaction = require('../models/transactionModel.js')
// const mongoose = require("mongoose");
// const User = require("../models/userModel.js");
exports.createTransaction = catchAsyncError(async (req, res) => {
  const transaction = new Transaction({
    transactionID: req.transactionID,
    transactionAmount: req.transactionAmount,
    serviceCharge: req.serviceCharge,
    sender: {
      user: req.sender._id,
      name: req.sender.name,
      email: req.sender.email,
      transacion: 'Debit',
    },
    receiver: {
      user: req.receiver._id,
      name: req.receiver.name,
      email: req.receiver.email,
      transacion: 'Credit',
    },
    paymentType: 'Points',
    transactionType: req.transactionType,
    transactionRelation: `${req.sender.role}-To-${req.receiver.role}`,
  })
  await transaction.save()
  res.status(200).json({ success: true, message: 'working', transaction })
})
