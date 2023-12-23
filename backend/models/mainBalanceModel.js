const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mainBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  Balance: {
    type: Number,
    default: 0,
  },
  dueBalance: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("MainBalance", mainBalanceSchema);
