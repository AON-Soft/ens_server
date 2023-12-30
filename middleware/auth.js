const ErrorHander = require("../utils/errorhander");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Shop = require("../models/shopModel");
const catchAsyncError = require("./catchAsyncError");

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
  const authHeader = req.headers["authorization"];

  if (typeof authHeader === "undefined") {
    return next(new ErrorHander("Authorization Header is Undefined", 401));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(
      new ErrorHander(
        "Please register first Or Your Cookies is not working",
        401
      )
    );
  }
  const secret = process.env.JWT_SECRET || "fjhhIOHfjkflsjagju0fujljldfgl";
  const decodedData = jwt.verify(token, secret);

  req.user = decodedData;
  next();
});

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  //   const { token } = req.cookies;

  const authHeader = req.headers["authorization"];

  if (typeof authHeader === "undefined") {
    return next(new ErrorHander("Authorization Header is Undefined", 401));
  }

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
