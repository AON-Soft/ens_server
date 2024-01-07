const catchAsyncError = require("../middleware/catchAsyncError");
const Categories = require("../models/categoryModel");
const shopModel = require("../models/shopModel");
const ApiFeatures = require("../utils/apifeature");
const ErrorHandler = require("../utils/errorhander");

exports.createCategory = catchAsyncError(async (req, res, next) => {

  // check the category name is already exist or not
  const exist = await Categories.findOne({ name: req.body.name });
  if (exist) {
    return next(new ErrorHandler("Category is already exist."));
  }

  const category = await Categories.create(req.body);
  if (!category) {
    return next(new ErrorHandler("Category is not created."));
  }
  const categoryWithout__v = category.toObject();
  delete categoryWithout__v.__v;

  res.status(201).json({ success: true, category:categoryWithout__v });
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

  const categoryWithout__v = category.toObject();
  delete categoryWithout__v.__v;

  res.status(200).json({ success: true, category:categoryWithout__v });
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

exports.getAllCategories = catchAsyncError(async (req, res) => {
  const resultPerPage = 10;
  const categoryCount = await Categories.countDocuments({  });
  const apiFeature = new ApiFeatures(
    Categories.find({  }),
    req.query
  )
    .search()
    .filter()
    .pagination(resultPerPage);

  let categories = await apiFeature.query;

  let filteredCategoriesCount = categories.length;


  res.status(200).json({
    success: true,
    categoryCount,
    resultPerPage,
    filteredCategoriesCount,
    categories,
  });
});
