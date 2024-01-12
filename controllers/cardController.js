const catchAsyncError = require('../middleware/catchAsyncError')
const cardModel = require('../models/cardModel')

const Product = require('../models/productModel')
const ErrorHandler = require('../utils/errorhander')

exports.createCard = catchAsyncError(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id })
  if (!product) {
    return next(new ErrorHandler('product not found', 404))
  }

  const existCard = await cardModel.findOne({ userId: req.user.id })
  if (existCard) {
    let productFound = false

    existCard.cardProducts.forEach((existingProduct) => {
      if (existingProduct.productId.toString() === req.params.id.toString()) {
        productFound = true
        return next(new ErrorHandler('This Product is already added', 404))
      }
    })

    if (!productFound) {
      const updatedCard = await cardModel.findByIdAndUpdate(
        existCard._id,
        {
          $push: {
            cardProducts: {
              productId: product._id,
              productName: product.name,
              productImage: product.images,
            },
          },
        },
        { new: true, useFindAndModify: false },
      )

      res.status(201).json({ success: true, card: updatedCard })
    }
  } else {
    req.body = {
      userId: req.user.id,
      shopID: product.shop,
      cardProducts: {
        productId: product._id,
        productName: product.name,
        productImage: product.images,
      },
    }

    const card = await cardModel.create(req.body)
    if (!card) {
      return next(new ErrorHandler('Card is not created'), 404)
    }

    const cardWithout__v = card.toObject()
    delete cardWithout__v.__v

    res.status(201).json({ success: true, card: cardWithout__v })
  }
})

exports.increaseQuantity = catchAsyncError(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id })
  if (!product) {
    return next(new ErrorHandler('Product not found', 404))
  }

  const availableStock = product.availableStock

  const card = await cardModel.findOne({ userId: req.user.id })
  if (!card) {
    return next(new ErrorHandler('Card is not found', 404))
  }

  const existingCardProduct = card.cardProducts.find(
    (product) => product.productId.toString() === req.params.id,
  )
  if (!existingCardProduct) {
    return next(new ErrorHandler("Product not found in the user's card", 404))
  }

  if (existingCardProduct.productQuantity === availableStock) {
    return next(
      new ErrorHandler(
        'You have already added all the available stock. There is none left.',
        404,
      ),
    )
  }

  const updatedCard = await cardModel.findOneAndUpdate(
    {
      userId: req.user.id,
      'cardProducts.productId': req.params.id,
      //   'cardProducts.productQuantity': { $lt: availableStock },
    },
    { $inc: { 'cardProducts.$.productQuantity': 1 } },
    { new: true, runValidators: true, useFindAndModify: false },
  )

  if (updatedCard) {
    const cardProductWithout__v = updatedCard.toObject()
    delete cardProductWithout__v.__v

    res.status(200).json({ success: true, card: cardProductWithout__v })
  } else {
    res.status(200).json({ success: true, card: card })
  }
})

exports.decreaseQuantity = catchAsyncError(async (req, res, next) => {
  const card = await cardModel.findOne({ userId: req.user.id })
  if (!card) {
    return next(new ErrorHandler('Card is not found', 404))
  }

  let updatedCard = await cardModel.findOneAndUpdate(
    {
      userId: req.user.id,
      'cardProducts.productId': req.params.id,
    },
    { $inc: { 'cardProducts.$.productQuantity': -1 } },
    { new: true, runValidators: true, useFindAndModify: false },
  )

  if (!updatedCard) {
    return next(
      new ErrorHandler(
        "Product not found in the user's card or quantity is already 0",
        404,
      ),
    )
  }

  if (
    updatedCard.cardProducts.find(
      (product) => product.productId.toString() === req.params.id,
    ).productQuantity === 0
  ) {
    updatedCard = await cardModel.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { cardProducts: { productId: req.params.id } } },
      { new: true, useFindAndModify: false },
    )
  }

  const cardProductWithout__v = updatedCard.toObject()
  delete cardProductWithout__v.__v

  res.status(200).json({ success: true, card: cardProductWithout__v })
})

exports.removeFromCard = catchAsyncError(async (req, res, next) => {
  const updatedCard = await cardModel.findOneAndUpdate(
    { userId: req.user.id },
    { $pull: { cardProducts: { productId: req.params.id } } },
    { new: true, useFindAndModify: false },
  )

  if (!updatedCard) {
    return next(new ErrorHandler("Product not found in the user's card", 404))
  }

  const cardProductWithout__v = updatedCard.toObject()
  delete cardProductWithout__v.__v

  res
    .status(200)
    .json({
      success: true,
      card: cardProductWithout__v,
      message: 'Product deleted successfully from Card',
    })
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
