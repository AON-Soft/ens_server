const fs = require('fs').promises
const cloudinary = require('cloudinary')
const catchAsyncError = require('../middleware/catchAsyncError')
const ShopCategory = require('../models/shopCategoryModel')
const ApiFeatures = require('../utils/apifeature')
const ErrorHandler = require('../utils/errorhander')
const shopModel = require('../models/shopModel')

exports.createShopCategory = catchAsyncError(async (req, res, next) => {
  const { name, parentId } = req.body

  const exist = await ShopCategory.findOne({ name })
  if (exist) {
    return next(new ErrorHandler(`${name} already exists.`))
  }

  let level = 0
  if (parentId) {
    const parentCategory = await ShopCategory.findById(parentId)
    if (!parentCategory) {
      return next(new ErrorHandler('Parent category not found', 404))
    }
    level = parentCategory.level + 1
    if (level > 2) {
      return next(new ErrorHandler('Maximum category depth reached', 400))
    }
  }

  if (req.files && req.files.image) {
    const tempFilePath = `temp_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.image.data)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'shopCategories',
      width: 150,
      crop: 'scale',
    })

    req.body.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    await fs.unlink(tempFilePath)
  }

  const shopCategory = await ShopCategory.create({
    ...req.body,
    parent: parentId || null,
    level,
  })

  if (!shopCategory) {
    return next(new ErrorHandler('Shop category is not created.', 404))
  }

  const shopCategoryWithout__v = shopCategory.toObject()
  delete shopCategoryWithout__v.__v

  res.status(201).json({ success: true, data: shopCategoryWithout__v })
})

exports.updateShopCategory = catchAsyncError(async (req, res, next) => {
  const { name, parentId } = req.body
  let shopCategory = await ShopCategory.findById(req.params.id)

  if (!shopCategory) {
    return next(new ErrorHandler('Shop category not found', 404))
  }

  if (name && name !== shopCategory.name) {
    const exist = await ShopCategory.findOne({ name })
    if (exist) {
      return next(new ErrorHandler(`${name} already exists.`))
    }
  }

  if (parentId !== undefined) {
    if (parentId === null) {
      shopCategory.parent = null
      shopCategory.level = 0
    } else {
      const parentCategory = await ShopCategory.findById(parentId)
      if (!parentCategory) {
        return next(new ErrorHandler('Parent category not found', 404))
      }
      if (parentCategory.level >= 2) {
        return next(new ErrorHandler('Maximum category depth reached', 400))
      }
      shopCategory.parent = parentId
      shopCategory.level = parentCategory.level + 1
    }
  }

  if (req.files && req.files.image) {
    const imageId = shopCategory.image.public_id
    const tempFilePath = `temp_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.image.data)
    await cloudinary.v2.uploader.destroy(imageId)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'shopCategories',
      width: 150,
      crop: 'scale',
    })

    req.body.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    await fs.unlink(tempFilePath)
  }

  shopCategory = await ShopCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  const shopCategoryWithout__v = shopCategory.toObject()
  delete shopCategoryWithout__v.__v

  res.status(200).json({ success: true, data: shopCategoryWithout__v })
})

exports.deleteShopCategory = catchAsyncError(async (req, res, next) => {
  const deleteShopCategory = await ShopCategory.findById(req.params.id)

  if (!deleteShopCategory) {
    return next(new ErrorHandler('Shop category not found', 404))
  }

  const shopUsingCategory = await shopModel.findOne({ category: req.params.id })

  if (shopUsingCategory) {
    return next(new ErrorHandler('Already in use by a shop', 400))
  }

  const childCategories = await ShopCategory.find({ parent: req.params.id })
  if (childCategories.length > 0) {
    return next(
      new ErrorHandler('Cannot delete category with subcategories', 400),
    )
  }

  if (deleteShopCategory.image && deleteShopCategory.image.public_id) {
    await cloudinary.v2.uploader.destroy(deleteShopCategory.image.public_id)
  }

  await ShopCategory.deleteOne({ _id: req.params.id })

  res
    .status(200)
    .json({ success: true, message: 'Shop category deleted successfully' })
})

exports.getAllShopCategories = catchAsyncError(async (req, res) => {
  let resultPerPage = 10
  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit)
  }

  const shopCategoryCount = await ShopCategory.countDocuments({})

  const apiFeature = new ApiFeatures(ShopCategory.find(), req.query)
    .search()
    .filter()

  // Execute the query without pagination to get all categories
  let shopCategories = await apiFeature.query

  if (!shopCategories || shopCategories.length === 0) {
    return res.status(200).json({
      success: true,
      shopCategoryCount: 0,
      resultPerPage,
      filteredShopCategoriesCount: 0,
      shopCategories: [],
    })
  }

  const filteredShopCategoriesCount = shopCategories.length

  const formatCategories = (categories, parentId = null) => {
    return categories
      .filter(
        (category) =>
          (parentId === null && !category.parent) ||
          (category.parent && category.parent.toString() === parentId),
      )
      .map((category) => ({
        _id: category._id,
        name: category.name,
        level: category.level,
        image: category.image,
        children: formatCategories(categories, category._id.toString()),
      }))
  }

  const formattedCategories = formatCategories(shopCategories)

  // Apply pagination after formatting
  const startIndex = (req.query.page - 1) * resultPerPage || 0
  const paginatedCategories = formattedCategories.slice(
    startIndex,
    startIndex + resultPerPage,
  )

  res.status(200).json({
    success: true,
    shopCategoryCount,
    resultPerPage,
    filteredShopCategoriesCount,
    shopCategories: paginatedCategories,
  })
})
