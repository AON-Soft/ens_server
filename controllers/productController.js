const fs = require('fs').promises
const cloudinary = require('cloudinary')
const Product = require('../models/productModel')
const Shop = require('../models/shopModel')
const ErrorHandler = require('../utils/errorhander')
const catchAsyncError = require('../middleware/catchAsyncError')
const ApiFeatures = require('../utils/apifeature')

exports.createProduct = catchAsyncError(async (req, res) => {
  req.body.user = req.user.id
  req.body.images = []
  const shop = await Shop.findOne({ createdBy: req.user.id })

  if (req.files && req.files.images) {
    const images = req.files.images

    for (const [index, image] of images.entries()) {
      const tempFilePath = `temp_${index}_${Date.now()}.jpg`
      await fs.writeFile(tempFilePath, image.data)

      const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
        folder: 'products',
        crop: 'scale',
      })

      req.body.images.push({
        index: index,
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      })

      await fs.unlink(tempFilePath)
    }
  }

  req.body.shop = shop._id
  const product = await Product.create(req.body)

  // delete __v
  product.__v = undefined
  product.reviews = undefined

  console.log(req.body.images)

  res.status(201).json({ success: true, product })
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

  res.status(200).json({ success: true, product })
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
