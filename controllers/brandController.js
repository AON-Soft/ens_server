const catchAsyncError = require("../middleware/catchAsyncError");
const Brand = require("../models/brandModel");
const ApiFeatures = require("../utils/apifeature");
const ErrorHandler = require("../utils/errorhander");

exports.createBrand = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
  req.body.shop = req.shop.id;
  const brand = await Brand.create(req.body);
  if (!brand) {
    return next(new ErrorHandler("Brand is not created."));
  }

  res.status(201).json({ success: true, brand });
});

exports.updateBrand = catchAsyncError(async (req, res, next) => {
  let brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ErrorHandler("brand not found", 404));
  }

  brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, brand });
});

exports.deleteBrand = catchAsyncError(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ErrorHandler("brand not found", 404));
  }

  await Brand.deleteOne({ _id: req.params.id });

  res
    .status(200)
    .json({ success: true, message: "category deleted sucesfully" });
});

exports.getAllBrands = catchAsyncError(async (req, res) => {
  const shopId = req.params.id;
  const resultPerPage = 10;
  const brndsCount = await Brand.countDocuments({ shop: shopId });
  const apiFeature = new ApiFeatures(Brand.find({ shop: shopId }), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  let brands = await apiFeature.query;

  let filteredBrandsCount = brands.length;

  //   apiFeature.pagination(resultPerPage);

  //   products = await apiFeature.query;

  res.status(200).json({
    success: true,
    brands,
    brndsCount,
    resultPerPage,
    filteredBrandsCount,
  });
});
