const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require("mongoose");

const User = require("../models/userModel.js");
const calculateServiceCharge = require("../utils/calculateServiceCharge");
const uniqueTransactionID = require("../utils/transactionID.js");
const ErrorHandler = require("../utils/errorhander.js");

exports.sendPoints = catchAsyncError(async (req, res, next) => {
  const { receiverEmail, amount } = req.body;
  const sender = req.user;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const receiver = await User.findOne({ email: receiverEmail }).session(
      session
    );

    const admin = await User.findOne({ role: "Admin" }).session(session);

    if (!receiver) {
      return next(new ErrorHandler("Receiver not found", 403));
    }
    if (!admin) {
      return next(new ErrorHandler("Admin not found", 403));
    }

    ///////////////////// We will dynamic here///////////////////////////
    const serviceCharge = await calculateServiceCharge(amount);
    ////////////////////////////////////////////////////////////////////
    if (sender.balance <= amount + serviceCharge) {
      return next(new ErrorHandler("Insufficient Balance", 400));
    }
    const trnxID = uniqueTransactionID();
    const sendPontsTranactionID = `SP${trnxID}`;
    sender.balance -= amount + serviceCharge;
    receiver.balance += amount;
    admin.balance += serviceCharge;

    await sender.save({ session });
    await receiver.save({ session });
    await admin.save({ session });

    await session.commitTransaction();
    session.endSession();

    req.transactionID = sendPontsTranactionID;
    req.sender = sender;
    req.receiver = receiver;
    req.transactionAmount = amount;
    req.serviceCharge = serviceCharge;
    req.transactionType = "SendPoints";
    next();
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: "Transaction failed" });
  }
});
