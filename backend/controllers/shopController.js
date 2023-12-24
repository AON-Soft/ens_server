const catchAsyncError = require("../middleware/catchAsyncError");

const Shop = require("../models/shopModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");

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

exports.updateShopProfile = catchAsyncError(async (req, res, next) => {
  console.log("=======================", req.shop);
  const shop = await Shop.findById(req.shop._id);
  const newUserData = {
    name: req.body.name,
    info: req.body.info,
    category: req.body.category,
    address: req.body.address,
  };

  //we will add cloudinary later

  const updatedShop = await Shop.findByIdAndUpdate(shop._id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(201).json({ success: true, updatedShop });
});

exports.getShopDetails = catchAsyncError(async (req, res, next) => {
  const shop = await Shop.findById(req.shop._id);

  res.status(200).json({ success: true, shop });
});

exports.logoutShop = catchAsyncError(async (req, res, next) => {
  res.cookie("shopToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "Logged Out Shop" });
});

exports.deleteShop = catchAsyncError(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);

  console.log("=============params=============", shop);

  if (!shop) {
    return next(
      new ErrorHandler(`Shop doesn't exist with Name: ${req.params.name}`, 400)
    );
  }

  await shop.deleteOne();
  res.status(200).json({ success: true, message: "Shop Deleted Successfully" });
});
