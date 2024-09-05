const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orderedProducts',
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  status: {
    type: String,
    default: 'in_queue',
    enum: ['success', 'failed', 'in_queue'],
  },
  notificationType: {
    type: String,
    default: 'order',
    enum: ['order', 'campaign', 'system'],
  },
  isAdminNotification: {
    type: Boolean,
    default: false,
  },
  isViewedByAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Notification', notificationSchema)
