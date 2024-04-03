const mongoose = require("mongoose");

const notificationModelSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orderedProducts', 
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please Enter Title'],
        trim: true,
    },
    message: {
        type: String,
        required: [true, 'Please Enter Message'],
        trim: true,
    },
    notificationType: {
        type: String,
        default: 'order',
        enum: ['order', 'cash_in', 'cash_out'],
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
  
});

module.exports = mongoose.model("Notification", notificationModelSchema);
