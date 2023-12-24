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
  sender: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
  },
  receiver: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
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
    enum: ["Cash Out", "Send Points", "Bill Payment"],
    required: true,
  },
  transactionRelation: {
    type: String,
    enum: [
      "AdminToAdmin",
      "AdminToAgent",
      "AgentToAgent",
      "AgentToAdmin",
      "AgentToUser",
      "UserToUser",
      "UserToAgent",
    ],
  },
  serviceCharge: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
