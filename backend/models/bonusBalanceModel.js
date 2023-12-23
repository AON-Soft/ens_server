const mongoose = require("mongoose");

const bonusBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  bonusBalance: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("BonusBalance", bonusBalanceSchema);
