const User = require("../models/userModel");
// const Balance = require("../models/mainBalanceModel");

const receivePoints = async (email, _, role) => {
  const receiver = await User.findOne({ email: email, role: role });

  if (!receiver) {
    // return ErrorHandler(`${role} not found`, 404);
  }

  // const mainBalance = await Balance.findOne({ user: receiver._id });
  // if (!mainBalance) {
  //   // return ErrorHandler(`Balance not found for this ${role}`, 404);
  // }
  // mainBalance.Balance += points;
  // await mainBalance.save();
  return receiver;
};

module.exports = receivePoints;
