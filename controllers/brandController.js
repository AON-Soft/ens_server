const fs = require('fs').promises
const cloudinary = require('cloudinary')
const catchAsyncError = require('../middleware/catchAsyncError')
const Brands = require('../models/brandModel')
const ApiFeatures = require('../utils/apifeature')
const ErrorHandler = require('../utils/errorhander')

exports.createBrandByAdmin = catchAsyncError(async (req, res, next) => {
  const exist = await Brands.findOne({ name: req.body.name })
  if (exist) {
    return next(new ErrorHandler('Brands is already exist.'))
  }
  req.body.shopCategory = req.params.id
  req.body.createdBy = req.user.id

  if (req.files && req.files.image) {
    const tempFilePath = `temp_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.image.data)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'brands',
      width: 150,
      crop: 'scale',
    })

    req.body.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    await fs.unlink(tempFilePath)
  }

  const brand = await Brands.create(req.body)
  if (!brand) {
    return next(new ErrorHandler('Brand is not created.'))
  }
  const brandWithout__v = brand.toObject()
  delete brandWithout__v.__v

  res.status(201).json({ success: true, data: brandWithout__v })
})

exports.createBrandByShop = catchAsyncError(async (req, res, next) => {
  // check the category name is already exist or not
  const exist = await Brands.findOne({
    name: req.body.name,
    shopCategory: req.shop.category,
  })
  if (exist) {
    return next(new ErrorHandler('Brand is already exist.'))
  }

  req.body.shopCategory = req.shop.category
  req.body.shopID = req.shop.id
  req.body.isDelatableByShop = true
  req.body.createdBy = req.user.id

  if (req.files && req.files.image) {
    const tempFilePath = `temp_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.image.data)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'brands',
      width: 150,
      crop: 'scale',
    })

    req.body.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    await fs.unlink(tempFilePath)
  }

  const brand = await Brands.create(req.body)
  if (!brand) {
    return next(new ErrorHandler('Brand is not created.'))
  }
  const brandWithout__v = brand.toObject()
  delete brandWithout__v.__v

  res.status(201).json({ success: true, data: brandWithout__v })
})

exports.updateBrand = catchAsyncError(async (req, res, next) => {
  let brand = await Brands.findById(req.params.id)
  if (!brand) {
    return next(new ErrorHandler('brand not found', 404))
  }

  const exist = await Brands.findOne({
    name: req.body.name,
    shopCategory: brand.shopCategory,
  })
  if (exist) {
    if (exist._id.toString() !== req.params.id.toString()) {
      return next(new ErrorHandler(`${req.body.name} is already exist`, 404))
    }
  }

  if (
    req.user.role === 'admin' ||
    req.user.id.toString() === brand.createdBy.toString()
  ) {
    if (req.files && req.files.image) {
      const imageId = brand.image.public_id
      await cloudinary.v2.uploader.destroy(imageId)
      const tempFilePath = `temp_${Date.now()}.jpg`
      await fs.writeFile(tempFilePath, req.files.image.data)

      const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
        folder: 'brands',
        width: 150,
        crop: 'scale',
      })

      req.body.image = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      }
      await fs.unlink(tempFilePath)
    }

    brand = await Brands.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })

    const brandWithout__v = brand.toObject()
    delete brandWithout__v.__v

    res.status(200).json({ success: true, data: brandWithout__v })
  } else {
    return next(
      new ErrorHandler('You are not Authorized to Update this brand'),
      404,
    )
  }
})

exports.deleteBrand = catchAsyncError(async (req, res, next) => {
  const brand = await Brands.findById(req.params.id)

  if (!brand) {
    return next(new ErrorHandler('brand not found', 404))
  }

  if (
    req.user.role === 'admin' ||
    req.user.id.toString() === brand.createdBy.toString()
  ) {
    await Brands.deleteOne({ _id: req.params.id })

    res.status(200).json({ success: true, message: 'brand deleted sucesfully' })
  } else {
    return next(
      new ErrorHandler('You are not Authorized to Delete this brand'),
      404,
    )
  }
})

exports.getAllBrandByshop = catchAsyncError(async (req, res) => {
  const resultPerPage = 10

  const brandCount = await Brands.countDocuments({
    $or: [{ shopCategory: req.shop.category }, { shopID: req.shop.id }],
  })
  const apiFeature = new ApiFeatures(
    Brands.find({
      $or: [{ shopCategory: req.shop.category }, { shopID: req.shop.id }],
    }),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let brands = await apiFeature.query

  let filteredBrandsCount = brands.length

  res.status(200).json({
    success: true,
    brandCount,
    resultPerPage,
    filteredBrandsCount,
    brands,
  })
})

exports.getAllBrandsByAdmin = catchAsyncError(async (req, res) => {
  const shopCategory = req.params.id
  const resultPerPage = 10

  const brandCount = await Brands.countDocuments({
    shopCategory: shopCategory,
  })
  const apiFeature = new ApiFeatures(
    Brands.find({ shopCategory: shopCategory }),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let brands = await apiFeature.query

  let filteredBrandsCount = brands.length

  res.status(200).json({
    success: true,
    brandCount,
    resultPerPage,
    filteredBrandsCount,
    brands,
  })
})
