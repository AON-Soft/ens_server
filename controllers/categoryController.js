const catchAsyncError = require('../middleware/catchAsyncError')
const Categories = require('../models/categoryModel')
const Shops = require('../models/shopModel')
const ApiFeatures = require('../utils/apifeature')
const ErrorHandler = require('../utils/errorhander')

exports.createCategoryByAdmin = catchAsyncError(async (req, res, next) => {
  // check the category name is already exist or not
  const exist = await Categories.findOne({ name: req.body.name })
  if (exist) {
    return next(new ErrorHandler('Category is already exist.'))
  }
  req.body.shopCategory = req.params.id
  req.body.createdBy = req.user.id

  const category = await Categories.create(req.body)
  if (!category) {
    return next(new ErrorHandler('Category is not created.'))
  }
  const categoryWithout__v = category.toObject()
  delete categoryWithout__v.__v

  res.status(201).json({ success: true, category: categoryWithout__v })
})

exports.createCategoryByShop = catchAsyncError(async (req, res, next) => {
  // check the category name is already exist or not
  const exist = await Categories.findOne({ name: req.body.name })
  if (exist) {
    return next(new ErrorHandler('Category is already exist.'))
  }

  req.body.shopCategory = req.shop.category
  req.body.shopID = req.shop.id
  req.body.isDelatableByShop = true
  req.body.createdBy = req.user.id

  const category = await Categories.create(req.body)
  if (!category) {
    return next(new ErrorHandler('Category is not created.'))
  }
  const categoryWithout__v = category.toObject()
  delete categoryWithout__v.__v

  res.status(201).json({ success: true, category: categoryWithout__v })
})

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  const exist = await Categories.findOne({ name: req.body.name })
  if (exist) {
    if (exist._id.toString() !== req.params.id.toString()) {
      return next(new ErrorHandler(`${req.body.name} is already exist`, 404))
    }
  }

  let category = await Categories.findById(req.params.id)
  if (!category) {
    return next(new ErrorHandler('category not found', 404))
  }

  if (
    req.user.role === 'admin' ||
    req.user.id.toString() === brand.createdBy.toString()
  ) {
    category = await Categories.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })

    const categoryWithout__v = brand.toObject()
    delete categoryWithout__v.__v

    res.status(200).json({ success: true, category: categoryWithout__v })
  } else {
    return next(
      new ErrorHandler('You are not Authorized to Update this brand'),
      404,
    )
  }
})

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await Categories.findById(req.params.id)

  if (!category) {
    return next(new ErrorHandler('category not found', 404))
  }

  if (
    req.user.role === 'admin' ||
    req.user.id.toString() === category.createdBy.toString()
  ) {
    await Categories.deleteOne({ _id: req.params.id })

    res
      .status(200)
      .json({ success: true, message: 'category deleted sucesfully' })
  } else {
    return next(
      new ErrorHandler('You are not Authorized to Delete this category'),
      404,
    )
  }
})

exports.getAllCategoriesByshop = catchAsyncError(async (req, res) => {
  const resultPerPage = 10

  const categoryCount = await Categories.countDocuments({
    $or: [{ shopCategory: req.shop.category }, { shopID: req.shop.id }],
  })
  const apiFeature = new ApiFeatures(
    Categories.find({
      $or: [{ shopCategory: req.shop.category }, { shopID: req.shop.id }],
    }),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let categories = await apiFeature.query

  let filteredCategoriesCount = categories.length

  res.status(200).json({
    success: true,
    categoryCount,
    resultPerPage,
    filteredCategoriesCount,
    categories,
  })
})

exports.getAllCategoriesByAdmin = catchAsyncError(async (req, res) => {
  const shopCategory = req.params.id
  const resultPerPage = 10

  const categoryCount = await Categories.countDocuments({
    shopCategory: shopCategory,
  })
  const apiFeature = new ApiFeatures(
    Categories.find({ shopCategory: shopCategory }),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let categories = await apiFeature.query

  let filteredCategoriesCount = categories.length

  res.status(200).json({
    success: true,
    categoryCount,
    resultPerPage,
    filteredCategoriesCount,
    categories,
  })
})

exports.getAllCategoriesByUser = catchAsyncError(async (req, res) => {
  const resultPerPage = 10

  const shop = await Shops.findById(req.params.id)

  const categoryCount = await Categories.countDocuments({
    $or: [{ shopCategory: shop.category }, { shopID: req.params.id }],
  })
  const apiFeature = new ApiFeatures(
    Categories.find({
      $or: [{ shopCategory: shop.category }, { shopID: req.params.id }],
    }),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let categories = await apiFeature.query

  let filteredCategoriesCount = categories.length

  res.status(200).json({
    success: true,
    categoryCount,
    resultPerPage,
    filteredCategoriesCount,
    categories,
  })
})
