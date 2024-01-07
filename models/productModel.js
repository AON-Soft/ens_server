const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter Product Description"],
  },

  price: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    maxLength: [8, "Price can't exceed 8 Characters"],
  },
  points: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    maxLength: [8, "Price can't exceed 8 Characters"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: {
    type: String,
    default: "",
  },
  categoryId:{
    type: mongoose.Schema.ObjectId,
    ref: "Categories",
  },
  subCategory: {
    type: String,
  },
  stockType: {
    type: String,
    enum: ["stockAsUnit", "stockAsQuantity"],
    required: true,
  },
  stockUnit: {
    type: Number,
    required: function () {
      return this.stockType === "stockAsUnit";
    },
  },
  stockQuantity: {
    type: Number,
    required: function () {
      return this.stockType === "stockAsQuantity";
    },
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        default: 0,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  shop: {
    type: mongoose.Schema.ObjectId,
    ref: "Shop",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Products", productSchema);
