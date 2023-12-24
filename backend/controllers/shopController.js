const catchAsyncError = require("../middleware/catchAsyncError");

const Shop = require("../models/shopModel");

exports.registerShop = catchAsyncError(async (req, res, next) => {
  const { name, info, logo, banner, category, address } = req.body;

  const shop = await Shop.create({
    name,
    info,
    logo,
    banner,
    category,
    address,
  });
  res.status(200).json({ succes: true, shop });
});
