const ErrorHandler = require('../utils/errorhander')
const catchAsyncError = require('./catchAsyncError')

const Product = require('../models/productModel')
const Card = require('../models/cardModel')

exports.existcard = catchAsyncError(async (req, _, next) => {
  const product = await Product.findOne({ _id: req.params.id });
  
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }
  
  const existCard = await Card.findOne({ userId: req.user.id });
  
  if (!existCard) {
    req.product = product;
    req.existCard = null; // Setting existCard to null as no card exists
    next();
  } else {
    if (existCard.shopID.toString() !== product.shop.toString()) {
      await Card.findByIdAndDelete(existCard._id);
      req.existCard = null; // Setting existCard to null as shopID doesn't match
    } else {
      req.existCard = existCard;
    }
    
    req.product = product;
    next();
  }
});

