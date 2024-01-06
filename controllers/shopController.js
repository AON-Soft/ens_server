const catchAsyncError = require("../middleware/catchAsyncError");

const Shop = require("../models/shopModel");
// const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");

exports.registerShop = catchAsyncError(async (req, res, next) => {

  console.log(req.user);

  const getShop = await Shop.findOne({ createdBy: req.user._id });
  if (getShop) {
    return next(new ErrorHandler("This Email is already registerd for a shop"));
  }
  

  const { name, info, logo, banner, category, address } = req.body;
  const createdBy = req.user._id;
  const shop = await Shop.create({
    name,
    info,
    logo,
    banner,
    category,
    address,
    createdBy,
  });
  res.status(200).json({ success: true, shop });
});

exports.updateShopProfile = catchAsyncError(async (req, res) => {
  console.log("=======================", req.shop);
  const shop = await Shop.findById(req.shop._id);
  const newUserData = {
    name: req.body.name,
    info: req.body.info,
    category: req.body.category,
    address: req.body.address,
  };

  //we will add cloudinary later

  const updatedShop = await Shop.findByIdAndUpdate(shop._id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(201).json({ success: true, updatedShop });
});

exports.updateShopLocation = catchAsyncError(async (req, res) => {
  const { latitude, longitude } = req.body;

  req.shop.location = {
    type: "Point",
    coordinates: [longitude, latitude],
  };

  await req.shop.save();

  res
    .status(200)
    .json({ success: true, message: "Shop location updated successfully" });
});

exports.getShopDetails = catchAsyncError(async (req, res) => {
  const shop = await Shop.findById(req.shop._id);

  res.status(200).json({ success: true, shop });
});

exports.deleteShop = catchAsyncError(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    return next(
      new ErrorHandler(`Shop doesn't exist with Name: ${req.params.name}`, 400)
    );
  }

  await shop.deleteOne();
  res.status(200).json({ success: true, message: "Shop Deleted Successfully" });
});

exports.getNearbyShops = catchAsyncError(async (req, res, next) => {
  const longitude = parseFloat(req.query.longitude);
  const latitude = parseFloat(req.query.latitude);

  if (isNaN(longitude) || isNaN(latitude)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid coordinates" });
  }

  const shops = await Shop.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "distance",
        maxDistance: 5000, // 5km in meters
        spherical: true,
      },
    },
    { $sort: { distance: 1 } }, // Sorting by distance in ascending order
  ]);
  if (!shops) {
    return next(new ErrorHandler("No Shops are available in your area", 404));
  }
  res.status(200).json({ success: true, data: shops });
});
