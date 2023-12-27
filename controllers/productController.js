const Product = require("../models/productModel");
const Shop = require("../models/shopModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncError = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeature");

exports.createProduct = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
  req.body.shop = req.shop.id;
  const product = await Product.create(req.body);

  res.status(201).json({ success: true, product });
});

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, product });
});

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await Product.deleteOne({ _id: req.params.id });

  res
    .status(200)
    .json({ success: true, message: "Product deleted sucesfully" });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  const shop = req.params.id;
  const resultPerPage = 12;

  const productsCount = await Product.countDocuments({ shop: shop });

  const apiFeature = new ApiFeatures(Product.find({ shop: shop }), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  const products = await apiFeature.queryResults();

  const filteredProductsCount = products.length;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});
