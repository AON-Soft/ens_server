const catchAsyncError = require('../middleware/catchAsyncError')
const cardModel = require('../models/cardModel')

const Product = require('../models/productModel')
const ErrorHandler = require('../utils/errorhander')

exports.createCard = catchAsyncError(async (req, res, next) => {
  const cardProduct = await cardModel.findOne({ productId: req.params.id })
  if (cardProduct) {
    return next(new ErrorHandler('This product is already added to card', 404))
  }
  const product = await Product.findOne({ _id: req.params.id })
  if (!product) {
    return next(new ErrorHandler('product not found', 404))
  }

  req.body = {
    productId: product._id,
    userId: req.user.id,
    productName: product.name,
    productImage: product.image,
    shopID: product.shop,
  }

  const card = await cardModel.create(req.body)
  if (!card) {
    return next(new ErrorHandler('Product is not added to Card'))
  }
  const cardWithout__v = card.toObject()
  delete cardWithout__v.__v

  res.status(201).json({ success: true, card: cardWithout__v })
})

exports.increaseQuantity = catchAsyncError(async (req, res, next) => {
  let cardProduct = await cardModel.findOne({
    productId: req.params.id,
    userId: req.user.id,
  })
  if (!cardProduct) {
    return next(new ErrorHandler('Please Add this product on card first', 404))
  }

  cardProduct = await cardModel.findByIdAndUpdate(
    cardProduct._id,
    { productQuantity: (cardProduct.productQuantity += 1) },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    },
  )

  const cardProductWithout__v = cardProduct.toObject()
  delete cardProductWithout__v.__v

  res.status(200).json({ success: true, card: cardProductWithout__v })
})

exports.decreaseQuantity = catchAsyncError(async (req, res, next) => {
  let cardProduct = await cardModel.findOne({
    productId: req.params.id,
    userId: req.user.id,
  })
  if (!cardProduct) {
    return next(new ErrorHandler('Please Add this product on card first', 404))
  }

  if (cardProduct.productQuantity === 0) {
    res.status(200).json({ success: true, card: cardProduct })
  } else {
    cardProduct = await cardModel.findByIdAndUpdate(
      cardProduct._id,
      { productQuantity: (cardProduct.productQuantity -= 1) },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    )

    const cardProductWithout__v = cardProduct.toObject()
    delete cardProductWithout__v.__v

    res.status(200).json({ success: true, card: cardProductWithout__v })
  }
})
exports.removeFromCard = catchAsyncError(async (req, res, next) => {
  let cardProduct = await cardModel.findOne({
    productId: req.params.id,
    userId: req.user.id,
  })
  if (!cardProduct) {
    return next(new ErrorHandler('Product is not found in card', 404))
  }

  await cardModel.deleteOne({ productId: req.params.id })

  res
    .status(200)
    .json({ success: true, message: 'product deleted sucesfully from Card' })
})

exports.getCard = catchAsyncError(async (req, res, next) => {
  let myCard = await cardModel.find({ userId: req.user.id })
  if (!myCard) {
    return next(new ErrorHandler('card is not found', 404))
  }
  res.status(200).json({ success: true, card: myCard })
})

exports.getCardByAdmin = catchAsyncError(async (req, res, next) => {
  let myCard = await cardModel.find({ userId: req.params.id })
  if (!myCard) {
    return next(new ErrorHandler('card is not found', 404))
  }
  res.status(200).json({ success: true, card: myCard })
})
