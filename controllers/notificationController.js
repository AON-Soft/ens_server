const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const admin = require('firebase-admin');
const ErrorHandler = require('../utils/errorhander')
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const serviceAccount = require('../serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.createFcmtoken = catchAsyncError(async (req, res, next)=>{
  const {userId, fcmToken} = req.body
  const userID = new mongoose.Types.ObjectId(userId)

 try {
    // Check if the user exists
    const existingUser = await userModel.findById(userID);

    if (!existingUser) {
      return next(new ErrorHandler('User not found', 404));
    }

    // Update the user's FCM token
    existingUser.fcmToken = fcmToken;
    await existingUser.save();

    res.status(200).json({ message: 'FCM token created successfully', user: existingUser });
  } catch (error) {
    return next(error);
  }

})

exports.sendNotification = catchAsyncError(async (req, res, next) => {

   try {
    // Extract request parameters
    const { orderId, title, message } = req.body;
    const userId = req.user.id

    // Retrieve user's FCM token (assuming you have stored it in your database)
    const user = await userModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler('User is not found'), 404)
    }

    // Check if the user has an FCM token
    if (!user.fcmToken) {
      return next(new ErrorHandler('FCM token is not available for the user.'));
    }

    // Prepare the notification payload
    const payload = {
      notification: {
        title: title,
        body: message
      },
      token: user.fcmToken,
    };

    // Send the notification
    await admin.messaging().send(payload);

    // Save the notification in the database
    const response = await notificationModel.create({ userId, orderId, title, message });
   

    res.status(200).json({ message: 'Notification sent successfully', data: response});
  } catch (error) {
    return next(error)
  }
  
})

