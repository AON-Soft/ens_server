const { default: mongoose } = require('mongoose')
const Product = require('../models/productModel')
const Shop = require('../models/shopModel')
const ErrorHandler = require('../utils/errorhander')
const catchAsyncError = require('../middleware/catchAsyncError')
const ApiFeatures = require('../utils/apifeature')

exports.createProduct = catchAsyncError(async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    const shop = await Shop.findOne({userId})
    if (!shop) {
      return next(new ErrorHandler('shop not found', 404))
    }
    req.body.user = userId

    var data = req.body
    data.shop = shop._id
    const product = await Product.create(req.body)
    // delete __v
    product.__v = undefined
    product.reviews = undefined

    res.status(201).json({ success: true, data:product })
  } catch (error) {
    next(error)
  }
})

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id)

  if (!product) {
    return next(new ErrorHandler('Product not found', 404))
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  res.status(200).json({ success: true, data:product })
})

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id)

  if (!product) {
    return next(new ErrorHandler('Product not found', 404))
  }

  await Product.deleteOne({ _id: req.params.id })

  res.status(200).json({ success: true, message: 'Product deleted sucesfully' })
})

exports.getAllProductsByShop = catchAsyncError(async (req, res) => {
  const resultPerPage = 10
  const productsCount = await Product.countDocuments({ user: req.user.id })
  const apiFeature = new ApiFeatures(
    Product.find({ user: req.user.id }).select('-__v -reviews -shop -user'),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let products = await apiFeature.query
  let filteredProductsCount = products.length

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  })
})

exports.adminGetAllProductsByShop = catchAsyncError(async (req, res) => {
  const resultPerPage = 10
  const productsCount = await Product.countDocuments({ shop: req.params.id })
  const apiFeature = new ApiFeatures(
    Product.find({ shop: req.params.id }).select('-__v -reviews -shop -user'),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let products = await apiFeature.query
  let filteredProductsCount = products.length

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  })
})

exports.getAllProductsByUser = catchAsyncError(async (req, res) => {
  const resultPerPage = 10
  const productsCount = await Product.countDocuments({ shop: req.params.id })
  const apiFeature = new ApiFeatures(
    Product.find({ shop: req.params.id }).select('-__v -reviews -shop -user'),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let products = await apiFeature.query
  let filteredProductsCount = products.length

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  })
})
