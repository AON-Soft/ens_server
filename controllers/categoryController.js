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

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  let category = await Categories.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("category not found", 404));
  }

  category = await Categories.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, category });
});
