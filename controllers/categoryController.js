const catchAsyncError = require("../middleware/catchAsyncError");
const Categories = require("../models/categoryModel");
const ApiFeatures = require("../utils/apifeature");
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

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await Categories.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("category not found", 404));
  }

  await Categories.deleteOne({ _id: req.params.id });

  res
    .status(200)
    .json({ success: true, message: "category deleted sucesfully" });
});

exports.getAllCategories = catchAsyncError(async (req, res, next) => {
  const shopId = req.params.id;
  const resultPerPage = 10;
  const categoryCount = await Categories.countDocuments({ shop: shopId });
  const apiFeature = new ApiFeatures(
    Categories.find({ shop: shopId }),
    req.query
  )
    .search()
    .filter()
    .pagination(resultPerPage);

  let categories = await apiFeature.query;

  let filteredCategoriesCount = categories.length;

  //   apiFeature.pagination(resultPerPage);

  //   products = await apiFeature.query;

  res.status(200).json({
    success: true,
    categories,
    categoryCount,
    resultPerPage,
    filteredCategoriesCount,
  });
});
