const ErrorHander = require("../utils/errorhander");
const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Shop = require("../models/shopModel");

exports.isAuthenticatedShop = catchAsyncError(async (req, res, next) => {
  const { shopToken } = req.cookies;

  if (!shopToken) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }

  const decodedData = jwt.verify(shopToken, process.env.JWT_SECRET);

  req.shop = await Shop.findById(decodedData.id);
  next();
});

exports.isAuthenticatedUserTemp = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }
  const secret = process.env.JWT_SECRET || "fjhhIOHfjkflsjagju0fujljldfgl";
  const decodedData = jwt.verify(token, secret);

  req.user = decodedData;
  next();
});

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }
  const secret = process.env.JWT_SECRET || "fjhhIOHfjkflsjagju0fujljldfgl";
  const decodedData = jwt.verify(token, secret);

  req.user = await User.findById(decodedData.id);
  next();
});

exports.isAuthorizeRoles = (...roles) => {
  return (req, res, next) => {
    roles.forEach((role) => {
      if (!role.includes(req.user.role)) {
        return next(
          new ErrorHander(
            `Role: ${req.user.role} is not allowed to access this resource`,
            403
          )
        );
      }
    });

    next();
  };
};
