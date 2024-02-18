const mongoose = require("mongoose");

const notificationModelSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    message: {
        type: String,
        required: [true, 'Please Enter Message'],
        trim: true,
    },
    notificationType: {
        type: String,
        required: true
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
