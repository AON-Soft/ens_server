const mongoose = require('mongoose')

const shopCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Enter a Category Name'],
    trim: true,
  },
  image: {
    public_id: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('shop_categories', shopCategorySchema)
