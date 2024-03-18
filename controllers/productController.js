const { default: mongoose } = require('mongoose')
const Product = require('../models/productModel')
const Shop = require('../models/shopModel')
const ErrorHandler = require('../utils/errorhander')
const catchAsyncError = require('../middleware/catchAsyncError')
const ApiFeatures = require('../utils/apifeature')

exports.createProduct = catchAsyncError(async (req, res, next) => {

   const { name, description, price, points, images, categoryId, stockUnit, availableStock, commission, unit, tags } = req.body;

    if (!name || !description || !price || !points || !stockUnit || !availableStock || !images || !categoryId || !commission) {
      return next(new ErrorHandler('Please provide all required fields', 400));
    }

  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Find the shop associated with the user
    const shop = await Shop.findOne({ userId });
    if (!shop) {
      return next(new ErrorHandler('Shop not found', 404));
    }

    // Create the product
    let productData = {
      name: name,
      description: description,
      price: price,
      points: points,
      images: { url: images },
      categoryId: categoryId || null,
      stockUnit: stockUnit,
      availableStock: availableStock,
      commission: commission || 0,
      user: userId,
      shop: shop._id,
    };

    if (unit) {
      productData.unit = unit;
    }
    if (tags && tags.length > 0) {
      productData.tags = tags;
    }

    const product = await Product.create(productData);

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
    if (req.body.images) {
      product.images = { url: req.body.images }; 
    }
    if (req.body.unit) {
      product.unit = req.body.unit;
    }
    if (req.body.tags && req.body.tags.length > 0) {
      product.tags = req.body.tags;
    }
    // Save product
    await product.save();

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
    })
    .populate({
      path: 'unit', 
      select: 'name abbreviation'
    })
    .populate({
      path: 'tags',
      select: 'name'
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
    })
    .populate({
      path: 'unit', 
      select: 'name abbreviation'
    })
    .populate({
      path: 'tags',
      select: 'name'
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
    })
    .populate({
      path: 'unit', 
      select: 'name abbreviation'
    })
    .populate({
      path: 'tags',
      select: 'name'
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
    }).populate({
      path: 'unit', 
      select: 'name abbreviation'
    })
    .populate({
      path: 'tags',
      select: 'name'
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

exports.getAllProducts = catchAsyncError(async (req, res) => {
  const resultPerPage = 10
  const productsCount = await Product.countDocuments()
  const apiFeature = new ApiFeatures(
    Product.find().select('-__v')
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
    })
    .populate({
      path: 'unit', 
      select: 'name abbreviation'
    })
    .populate({
      path: 'tags',
      select: 'name'
    })
    .sort({ createdAt: -1 }),
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

exports.productSearch = catchAsyncError(async (req, res, next) => {
  const { query } = req.query;
  try {
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }
    const result = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
      ]
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error)
  }
})

//Update User status ---Admin
exports.updateProductStatus = catchAsyncError(async (req, res, next) => {
 try {
   const newUserData = {
    status: req.body.status,
  }
  await Product.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

   const product = await Product.findById(req.params.id)

  res.status(200).json({ success: true, data: product })
 } catch (error) {
  next(error)
 }
})