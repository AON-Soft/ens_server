const { default: mongoose } = require('mongoose')
const fs = require('fs').promises
const cloudinary = require('cloudinary')
const Product = require('../models/productModel')
const Shop = require('../models/shopModel')
const ErrorHandler = require('../utils/errorhander')
const catchAsyncError = require('../middleware/catchAsyncError')
const ApiFeatures = require('../utils/apifeature')

exports.createProduct = catchAsyncError(async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  try {
    const shop = await Shop.findOne({ userId });
    if (!shop) {
      return next(new ErrorHandler('Shop not found', 404));
    }
    req.body.user = userId;

    if (!req.files.images || req.files.images.length === 0) {
      return next(new ErrorHandler('Images not found', 404));
    }

    const uploadedImages = [];
    for (const image of req.files.images) {
      const tempFilePath = `temp_${Date.now()}_${image.name}`;
      await image.mv(tempFilePath);

      const myCloudImage = await cloudinary.v2.uploader.upload(tempFilePath, {
        folder: 'productImages',
        crop: 'scale',
      });

      uploadedImages.push({
        public_id: myCloudImage.public_id,
        url: myCloudImage.secure_url,
      });

      await fs.unlink(tempFilePath);
    }

    req.body.images = uploadedImages;
    req.body.shop = shop._id;

    const product = await Product.create(req.body);
    
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Find the product
    let product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    // Check if the user owns the product
    if (product.user.toString() !== userId.toString()) {
      return next(new ErrorHandler('You are not authorized to update this product', 403));
    }

    // Update product fields if provided in the request body
    if (req.body.name) {
      product.name = req.body.name;
    }
    if (req.body.description) {
      product.description = req.body.description;
    }
    if (req.body.price) {
      product.price = req.body.price;
    }
    if (req.body.points) {
      product.points = req.body.points;
    }
    if (req.body.ratings) {
      product.ratings = req.body.ratings;
    }
    if (req.body.categoryId) {
      product.categoryId = req.body.categoryId;
    }
    if (req.body.stockUnit) {
      product.stockUnit = req.body.stockUnit;
    }
    if (req.body.availableStock) {
      product.availableStock = req.body.availableStock;
    }
    if (req.body.numOfReviews) {
      product.numOfReviews = req.body.numOfReviews;
    }
    if (req.body.commission) {
      product.commission = req.body.commission;
    }
    if (req.files && req.files.images) {
      if (req.files.images.length === 0) {
        return next(new ErrorHandler('Images not found', 404));
      }

      const uploadedImages = [];
      for (const image of req.files.images) {
        const tempFilePath = `temp_${Date.now()}_${image.name}`;
        await image.mv(tempFilePath);

        const myCloudImage = await cloudinary.v2.uploader.upload(tempFilePath, {
          folder: 'productImages',
          crop: 'scale',
        });

        uploadedImages.push({
          public_id: myCloudImage.public_id,
          url: myCloudImage.secure_url,
        });

        await fs.unlink(tempFilePath);
      }

    } 
   
    // Save the updated product
    await product.save();

    // Return the updated product
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

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
    Product.find({ user: req.user.id }).select('-__v')
    .populate({
      path: 'categoryId',
      select: 'image name'
    })
    .populate({
      path: 'user',
      select: 'image name'
    })
    .populate({
      path: 'shop',
      select: 'logo banner name'
    }),
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
    Product.find({ user: req.user.id }).select('-__v')
    .populate({
      path: 'categoryId',
      select: 'image name'
    })
    .populate({
      path: 'user',
      select: 'image name'
    })
    .populate({
      path: 'shop',
      select: 'logo banner name'
    }),
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
    Product.find({ user: req.user.id }).select('-__v')
    .populate({
      path: 'categoryId',
      select: 'image name'
    })
    .populate({
      path: 'user',
      select: 'image name'
    })
    .populate({
      path: 'shop',
      select: 'logo banner name'
    }),
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

exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v')
    .populate({
      path: 'categoryId',
      select: 'image name'
    })
    .populate({
      path: 'user',
      select: 'image name'
    })
    .populate({
      path: 'shop',
      select: 'logo banner name'
    }).exec()

  if (!product) {
    return next(new ErrorHandler('Product not found', 404))
  }
  res.status(200).json({
    success: true,
    data: product,
  })
  } catch (error) {
    next(error)
  }
})
