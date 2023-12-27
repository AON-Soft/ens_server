const catchAsyncError = require("../middleware/catchAsyncError");

const Transaction = require("../models/transactionModel");

const sendPoints = require("../utils/sendPoints");
const receivePoints = require("../utils/receivePoints");
const uniquetransactionID = require("../utils/transactionID");

exports.createTransaction = catchAsyncError(async (req, res, next) => {
  const receiver = req.dataOptions.receiver;
  try {
    const transactionID = await uniquetransactionID();
    const body = {
      transactionID: transactionID,
      transactionAmount: req.dataOptions.points,
      receiver: {
        user: receiver._id,
        name: receiver.name,
        email: receiver.email,
      },
      sender: {
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      paymentType: "Points",
      transactionType: "Send Points",
    };
    const transaction = await Transaction.create(body);

    res.status(202).json({
      message: `Succesffully transfered ${req.dataOptions.points} points to ${receiver.email} `,
      transaction,
    });
  } catch (error) {
    console.error("Error receiving points:", error);
    await receivePoints(req.user.email, req.dataOptions.points, req.user.role);
    await sendPoints(receiver.email, req.dataOptions.points, receiver.role);
    res.status(500).json({
      error: "Internal server error",
      message: "Error from TransactionID section ",
    });
  }
});

exports.addPointAdminToAgent = catchAsyncError(async (req, res, next) => {
  try {
    const { email, points } = req.body;

    if (!email || !points || isNaN(points)) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    await sendPoints(req.user.email, points, "Admin");

    try {
      const receiver = await receivePoints(email, points, "Agent");
      req.dataOptions = { points, receiver };
      next();
    } catch (receiveError) {
      console.error("Error receiving points:", receiveError);
      await receivePoints(req.user.email, points, "Admin");
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
