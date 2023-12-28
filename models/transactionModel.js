const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionID: {
    type: String,
    unique: true,
    required: true,
  },
  transactionAmount: {
    type: Number,
    required: true,
  },
  serviceCharge: {
    type: Number,
    required: true,
  },
  sender: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    transacion: String,
  },
  receiver: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    transacion: String,
  },
  paymentType: {
    type: String,
    enum: ["Cash", "Points"],
    required: true,
  },
  invoiceID: {
    type: String,
  },
  transactionType: {
    type: String,
    enum: ["PointsIn", "PointsOut", "Payment", "SendPoints"],
    required: true,
  },
  transactionRelation: {
    type: String,
    enum: [
      "UserToUser",
      "UserToAgent",
      "UserToShopKeeper",
      "AgentToAgent",
      "AgentToAdmin",
      "AgentToUser",
      "AgentToShopKeeper",
      "AdminToAdmin",
      "AdminToAgent",
      "ShopKeeperToAgent",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
