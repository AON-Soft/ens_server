const catchAsyncError = require("../middleware/catchAsyncError");

const Shop = require("../models/shopModel");
const User = require("../models/userModel");

const sendTokenForShop = require("../utils/shopjwtToken");
exports.registerShop = catchAsyncError(async (req, res, next) => {
  const { name, info, logo, banner, category, address } = req.body;

  const shop = await Shop.create({
    name,
    info,
    logo,
    banner,
    category,
    address,
  });
  sendTokenForShop(shop, 200, res);
});

exports.loginShop = catchAsyncError(async (req, res, next) => {
  let shop = await Shop.findById(req.params.id);
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email & Password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email & Password", 401));
  }

  sendTokenForShop(shop, 200, res);
});
