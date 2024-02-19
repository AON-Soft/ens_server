const catchAsyncError = require('../middleware/catchAsyncError')
const admin = require('firebase-admin');
const ErrorHandler = require('../utils/errorhander')
// const userModel = require('../models/userModel')
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const serviceAccount = require('../serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendNotification = catchAsyncError(async (req, res, next) => {

   try {
    // Extract request parameters
    const { orderId, title, message, fcmToken } = req.body;
    const userId = req.user.id

    // Retrieve user's FCM token (assuming you have stored it in your database)
    const user = await userModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler('User is not found'), 404)
    }

    // Prepare the notification payload
    const payload = {
      notification: {
        title: title,
        body: message
      },
      token: fcmToken,
    };

    // Send the notification
    await admin.messaging().send(payload);

    // Save the notification in the database
    const response = await notificationModel.create({ userId, orderId, title, message });
   

    res.status(200).json({ message: 'Notification sent successfully', response});
  } catch (error) {
    console.error('Error sending notification:', error);
    return next(new ErrorHandler('Notification is not created.'))
  }
  
})

