const catchAsyncError = require('../middleware/catchAsyncError')
const admin = require('firebase-admin');
const ErrorHandler = require('../utils/errorhander')
const userModel = require('../models/userModel')
const notificationModel = require('../models/notificationModel')

const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

exports.sendNotification = catchAsyncError(async (req, res, next) => {
   try {
    // Extract request parameters
    const { userId, orderId, title, message } = req.body;

    // Retrieve user's FCM token (assuming you have stored it in your database)
    // const user = await userModel.findById(userId);
    const  registrationToken = req.body.registrationToken
    const options =  notification_options
    
      admin.messaging().sendToDevice(registrationToken, message, options)
      .then( response => {

       res.status(200).send({msg:"Notification sent successfully", response})
       
      })
      .catch( error => {
          return next(new ErrorHandler('Notification is not created.', error))
      });
    // Save the notification in the database
    await notificationModel.create({ userId, orderId, title, message });

    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    return next(new ErrorHandler('Notification is not created.'))
  }
  
})

