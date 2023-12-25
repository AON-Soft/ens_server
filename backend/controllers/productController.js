const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncError = require("../middleware/catchAsyncError");
const ApiFeature = require("../utils/apifeature");

exports.createProduct = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
  req.body.shop = req.shop.id;
  const product = await Product.create(req.body);

  res.status(201).json({ success: true, product });
});
