const fs = require('fs').promises
const cloudinary = require('cloudinary')
const catchAsyncError = require('../middleware/catchAsyncError')
const { default: mongoose } = require('mongoose')
const Shop = require('../models/shopModel')
const ErrorHandler = require('../utils/errorhander')
const ApiFeatures = require('../utils/apifeature')
const productModel = require('../models/productModel')
const transactionModel = require('../models/transactionModel')
const orderedProductModel = require('../models/orderedProductModel')

exports.registerShop = catchAsyncError(async (req, res, next) => {

  const getShop = await Shop.findOne({ createdBy: req.user.id })
  if (getShop) {
    return next(new ErrorHandler('Shop Alredy Exist ! You can create one shop'))
  }

  req.body.createdBy = req.user.id
  req.body.userId = req.user.id

  if (req.files && req.files.banner) {
    const tempFilePath = `temp1_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.banner.data)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'shopBanners',
      crop: 'scale',
    })

    req.body.banner = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }

    await fs.unlink(tempFilePath)
  }

  if(!req.files.logo || req.files.logo === 'undefined'){
    return next(new ErrorHandler('Logo not found', 404))
  }

  if (req.files && req.files.logo) {
    const tempFilePath1 = `temp1_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath1, req.files.logo.data)

    const myCloudForlogo = await cloudinary.v2.uploader.upload(tempFilePath1, {
      folder: 'shopLogos',
      crop: 'scale',
    })
    req.body.logo = {
      public_id: myCloudForlogo.public_id,
      url: myCloudForlogo.secure_url,
    }
    await fs.unlink(tempFilePath1)
  }

  const shop = await Shop.create(req.body)
  res.status(200).json({ success: true, data:shop })
})

exports.updateShopProfile = catchAsyncError(async (req, res) => {
  const shop = await Shop.findById(req.shop._id);

  // check if shop lat and long
  if (req.body.latitude && req.body.longitude) {
    req.body.location = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude],
    };
  }

  if (req.files && req.files.banner) {
    const bannerImageId = shop.banner.public_id;
    await cloudinary.v2.uploader.destroy(bannerImageId);
    const tempFilePath = `temp1_${Date.now()}.jpg`;
    await fs.writeFile(tempFilePath, req.files.banner.data);

    // Upload the new banner image to Cloudinary
    const myCloud = await cloudinary.v2.uploader.upload(req.files.banner.path, {
      folder: 'shopBanners',
      crop: 'scale',
    });

    req.body.banner = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await fs.unlink(tempFilePath);
    
  }

  if (req.files && req.files.logo) {
    const logoImageId = shop.logo.public_id;
    await cloudinary.v2.uploader.destroy(logoImageId);
    const tempFilePath1 = `temp1_${Date.now()}.jpg`;
    await fs.writeFile(tempFilePath1, req.files.logo.data);

    const myCloudForlogo = await cloudinary.v2.uploader.upload(tempFilePath1, {
      folder: 'shopLogos',
      crop: 'scale',
    });
    req.body.logo = {
      public_id: myCloudForlogo.public_id,
      url: myCloudForlogo.secure_url,
    };
    await fs.unlink(tempFilePath1);
  }

  // Update shop details except the banner
  const updatedShop = await Shop.findByIdAndUpdate(shop._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // Return updated shop
  res.status(201).json({ success: true, data:updatedShop });
});


exports.updateShopLocation = catchAsyncError(async (req, res, next) => {
  const { latitude, longitude } = req.body
  const shop = await Shop.findById(req.shop.id)

  if (!shop) {
    return next(new ErrorHandler('Shop not found', 404))
  }

 // Check if latitude and longitude are provided in the request body
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
  }

  const longitudeValue = parseFloat(longitude);
  const latitudeValue = parseFloat(latitude);

  // Validate latitude and longitude
  if (isNaN(latitudeValue) || isNaN(longitudeValue) || latitudeValue < -90 || latitudeValue > 90 || longitudeValue < -180 || longitudeValue > 180) {
    return res.status(400).json({ success: false, message: 'Invalid latitude or longitude values.' });
  }

  // Update location coordinates
  shop.location = {
    type: 'Point',
    coordinates: [longitudeValue, latitudeValue],
  };

  // Save the updated shop with new location coordinates
  await shop.save();

  res.status(200).json({ success: true, message: 'Update successfully.' });

})

exports.getShopDetailsByShopKeeper = catchAsyncError(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.shop._id).populate({
      path: 'category',
      select: 'name image'
    }).populate({
      path: 'userId',
      select: 'avatar name email mobile balance bonusBalance duebalance'
    }).exec();

    if(!shop){
      return next(new ErrorHandler('Shop not found', 404))
    }
      res.status(200).json({ success: true, data: shop })
    }
  catch(error){
    next(error)
  }
})

exports.deleteShop = catchAsyncError(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id)

  if (!shop) {
    return next(
      new ErrorHandler(`Shop doesn't exist with Name: ${req.params.name}`, 400),
    )
  }

  await shop.deleteOne()
  res.status(200).json({ success: true, message: 'Shop Deleted Successfully' })
})

exports.getNearbyShops = catchAsyncError(async (req, res, next) => {
  const longitude = parseFloat(req.query.longitude)
  const latitude = parseFloat(req.query.latitude)

  if (isNaN(longitude) || isNaN(latitude)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid coordinates' })
  }

  const shops = await Shop.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance: 5000, // 5km in meters
        spherical: true,
      },
    },
    { $sort: { distance: 1 } },
  ])
  if (!shops) {
    return next(new ErrorHandler('No Shops are available in your area', 404))
  }
  res.status(200).json({ success: true, data: shops })
})

exports.getAllShops = catchAsyncError(async (req, res) => {
  const resultPerPage = 10
  const count = await Shop.countDocuments()
  const apiFeature = new ApiFeatures(
    Shop.find(),
    req.query,
  )
    .search()
    .filter()
    .pagination(resultPerPage)

  let shops = await apiFeature.query
  let filteredCount = shops.length

  res.status(200).json({
    success: true,
    shops,
    count,
    resultPerPage,
    filteredCount,
  })
})

exports.updateShopStatus = catchAsyncError(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);

  if(!shop){
    return next(new ErrorHandler('Shop not found', 404))
  }

  // Update shop details except the banner
  const updatedShop = await Shop.findByIdAndUpdate(shop._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // Return updated shop
  res.status(201).json({ success: true, data:updatedShop });
  } catch (error) {
    next(error)
  }
})

exports.getShopDetails = catchAsyncError(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate({
      path: 'category',
      select: 'name image'
    }).populate({
      path: 'userId',
      select: 'avatar name email mobile balance bonusBalance duebalance'
    }).exec();

    if(!shop){
      return next(new ErrorHandler('Shop not found', 404))
    }
      res.status(200).json({ success: true, data: shop })
    }
  catch(error){
    next(error)
  }
})

exports.getPrductsByShopID = catchAsyncError(async (req, res, next) => {
  const resultPerPage = 10
  try {
    const shop = await Shop.findById(req.params.id).exec();

    if(!shop){
      return next(new ErrorHandler('Shop not found', 404))
    }
    const productsCount = await productModel.countDocuments({ shop: req.params.id })
    const apiFeature = new ApiFeatures(
      productModel.find({ shop: shop._id }).select('-__v')
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
      data: products,
      count: productsCount,
      resultPerPage,
      filteredProductsCount,
    })
    }
  catch(error){
    next(error)
  }
})

exports.getTransactionsByShopID = catchAsyncError(async (req, res, next) => {
  const resultPerPage = 10; 
  const page = req.query.page || 1; 

  try {
    const shop = await Shop.findById(req.params.id).exec();

    if(!shop){
      return next(new ErrorHandler('Shop not found', 404))
    }

    const userId = new mongoose.Types.ObjectId(shop.userId);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactionPipeline = [
      {
        $match: {
          $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalUpcomingPoints: {
            $sum: {
              $cond: [
                { $eq: ['$receiver.user', userId] },
                '$transactionAmount',
                0,
              ],
            },
          },
          totalOutgoingPoints: {
            $sum: {
              $cond: [{ $eq: ['$sender.user', userId] }, '$transactionAmount', 0],
            },
          },
          transactionsHistory: {
            $push: {
              transactionID: '$transactionID',
              transactionType: '$transactionType',
              transactionAmount: '$transactionAmount',
              flag: {
                $cond: [
                  { $eq: ['$sender.user', userId] },
                  '$sender.flag',
                  '$receiver.flag',
                ],
              },
              transactionHeading: {
                $cond: [
                  { $eq: ['$sender.user', userId] },
                  '$sender.transactionHeading',
                  '$receiver.transactionHeading',
                ],
              },
              date: '$createdAt',
            },
          },
        },
      },
      {
        $skip: (page - 1) * resultPerPage 
      },
      {
        $limit: resultPerPage 
      }
    ];

    const transactionResult = await transactionModel.aggregate(transactionPipeline);

    if (transactionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found for the user in the last 6 months.',
        transactionResult,
      });
    }

    const { totalUpcomingPoints, totalOutgoingPoints, transactionsHistory } =
      transactionResult[0];

    // Count total number of transactions for the user
    const countPipeline = [
      {
        $match: {
          $or: [{ 'sender.user': userId }, { 'receiver.user': userId }],
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $count: 'count'
      }
    ];

    const countResult = await transactionModel.aggregate(countPipeline);
    const count = countResult.length > 0 ? countResult[0].count : 0;

    res.status(200).json({
      success: true,
      totalUpcomingPoints,
      totalOutgoingPoints,
      data: transactionsHistory,
      count, 
      resultPerPage,
      filteredCount: transactionsHistory.length,
    });
  }
  catch(error){
    next(error)
  }
})

exports.getOrdersByShopID = catchAsyncError(async (req, res, next) => {
  const resultPerPage = 10; 
  const page = req.query.page || 1; 
  try {
      const shop = await Shop.findById(req.params.id).exec();

      if(!shop){
        return next(new ErrorHandler('Shop not found', 404))
      }
      const shopId = new mongoose.Types.ObjectId(shop._id)
    

      const pipeline = [
        {
          $match: {
            shopID: shopId,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: '$userDetails',
        },
        {
          $project: {
            name: '$userDetails.name',
            email: '$userDetails.email',
            avatar: '$userDetails.avatar',
            orderId: '$_id',
            orderStatus: 1,
            totalBill: 1,
          },
        },
        {
          $skip: (page - 1) * resultPerPage
        },
        {
          $limit: resultPerPage 
        }
      ]

    const result = await orderedProductModel.aggregate(pipeline)
    // Count total number of orders for the user
    const countPipeline = [
      {
        $match: {
          shopID: shopId,
        },
      },
      {
        $count: 'count'
      }
    ];

    const countResult = await orderedProductModel.aggregate(countPipeline);
    const count = countResult.length > 0 ? countResult[0].count : 0;

    res.status(200).json({
      success: true,
      data: result,
      count, 
      resultPerPage,
      filteredCount: result.length 
    });
    
    }
  catch(error){
    next(error)
  }
})
