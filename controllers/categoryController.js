const catchAsyncError = require("../middleware/catchAsyncError");
const Categories = require("../models/categoryModel");
const ErrorHandler = require("../utils/errorhander");

exports.createCategory = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
  req.body.shop = req.shop.id;
  const category = await Categories.create(req.body);
  if (!category) {
    return next(new ErrorHandler("Category is not created."));
  }

  res.status(201).json({ success: true, category });
});
