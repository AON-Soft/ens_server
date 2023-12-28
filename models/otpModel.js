const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please Enter your Email"],
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email"],
    },
    otp: {
      type: String,
      required: [true, "Please Enter your OTP"],
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 300 },
    },
  },
  { timestamps: true }
);

otpSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) {
    next();
  }
  this.otp = await bcrypt.hash(this.otp, 10);
});
otpSchema.methods.compareOtp = async function (enteredOtp) {
  return await bcrypt.compare(enteredOtp, this.otp);
};

module.exports = mongoose.model("Otp", otpSchema);
