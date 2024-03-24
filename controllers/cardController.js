const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const cardModel = require('../models/cardModel')

const Product = require('../models/productModel')
const ErrorHandler = require('../utils/errorhander')

exports.createCard = catchAsyncError(async (req, res, next) => {
  const product = req.product;
  const existCard = req.existCard;

  if (existCard) {
    let productFound = false;

    existCard.cardProducts.forEach((existingProduct) => {
      if (existingProduct.productId.toString() === req.params.id.toString()) {
        productFound = true;
        return next(new ErrorHandler('This Product is already added', 404));
      }
    });

    if (!productFound) {
      const updatedCard = await cardModel.findByIdAndUpdate(
        existCard._id,
        {
          $push: {
            cardProducts: {
              productId: product._id,
              productName: product.name,
              productImage: product.images,
              productQuantity: 1,
              price: product.price,
              totalPrice: product.price * 1,
              commission: product.commission,
            },
          },
        },
        { new: true, useFindAndModify: false }
      );

      return res.status(201).json({ success: true, data: updatedCard });
    }
  } else {
    const cardData = {
      userId: req.user.id,
      shopID: product.shop,
      cardProducts: [
        {
          productId: product._id,
          productName: product.name,
          productImage: product.images,
          productQuantity: 1,
          price: product.price,
          totalPrice: product.price * 1,
          commission: product.commission,
        },
      ],
    };

    const card = await cardModel.create(cardData);
    if (!card) {
      return next(new ErrorHandler('Card is not created', 404));
    }

    const response = await cardModel.findById(card._id).select('-__v').exec();

    return res.status(201).json({ success: true, data: response });
  }
});

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
    res.status(200).json({ success: true, data: card })
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

  res.status(200).json({ success: true, data: cardProductWithout__v })
})

exports.removeFromCard = catchAsyncError(async (req, res, next) => {
   try {
    const deletedCard = await cardModel.findOneAndDelete({ _id: req.params.id });

    if (!deletedCard) {
      return next(new ErrorHandler("Card not found", 404));
    }
    const response = await cardModel.find({ userId: req.user.id })
    res.status(200).json({success: true, data: response});
  } catch (error) {
    return next(error); 
  }
});

exports.removeProductFromCard = catchAsyncError(async (req, res, next) => {
  const existCard = req.existCard;

  if (!existCard) {
    return next(new ErrorHandler('Card not found', 404));
  }

  const productId = req.params.id;

  const productIndex = existCard.cardProducts.findIndex(product => product.productId.toString() === productId);

  if (productIndex === -1) {
    return next(new ErrorHandler('Product not found in the card', 404));
  }

  const updatedCard = await cardModel.findByIdAndUpdate(
    existCard._id,
    {
      $pull: { 
        cardProducts: { productId: new mongoose.Types.ObjectId(productId) } 
      }
    },
    { new: true, useFindAndModify: false }
  );

  if (!updatedCard) {
    return next(new ErrorHandler('Failed to remove product from card', 500));
  }

  res.status(200).json({ success: true, data: updatedCard });
});




exports.getCard = catchAsyncError(async (req, res, next) => {
  let myCard = await cardModel.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(req.user.id) },
    },
    {
      $unwind: '$cardProducts',
    },
    {
      $lookup: {
        from: 'products',
        localField: 'cardProducts.productId',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    {
      $addFields: {
        'cardProducts.price': { $arrayElemAt: ['$productInfo.price', 0] },
        'cardProducts.totalPrice': {
          $multiply: [
            { $arrayElemAt: ['$productInfo.price', 0] },
            '$cardProducts.productQuantity',
          ],
        },
        'cardProducts.commission': { $arrayElemAt: ['$productInfo.commission', 0] },
        'cardProducts.totalCommission': {
          $multiply: [
            { $arrayElemAt: ['$productInfo.commission', 0] },
            '$cardProducts.productQuantity',
          ],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        userId: { $first: '$userId' },
        shopID: { $first: '$shopID' },
        cardProducts: { $push: '$cardProducts' },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        shopID: 1,
        cardProducts: 1,
      },
    },
  ])

  if (!myCard || myCard.length === 0) {
    return next(new ErrorHandler('Card is not found', 404))
  }

  res.status(200).json({ success: true, card: myCard[0] })
})

exports.getCardByAdmin = catchAsyncError(async (req, res, next) => {
  let myCard = await cardModel.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $unwind: '$cardProducts',
    },
    {
      $lookup: {
        from: 'products',
        localField: 'cardProducts.productId',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    {
      $addFields: {
        'cardProducts.price': { $arrayElemAt: ['$productInfo.price', 0] },
        'cardProducts.totalPrice': {
          $multiply: [
            { $arrayElemAt: ['$productInfo.price', 0] },
            '$cardProducts.productQuantity',
          ],
        },
        'cardProducts.commission': { $arrayElemAt: ['$productInfo.commission', 0] },
        'cardProducts.totalCommission': {
          $multiply: [
            { $arrayElemAt: ['$productInfo.commission', 0] },
            '$cardProducts.productQuantity',
          ],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        userId: { $first: '$userId' },
        shopID: { $first: '$shopID' },
        cardProducts: { $push: '$cardProducts' },
      },
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        shopID: 1,
        cardProducts: 1,
      },
    },
  ])

  if (!myCard || myCard.length === 0) {
    return next(new ErrorHandler('Card is not found', 404))
  }

  res.status(200).json({ success: true, card: myCard[0] })
})


