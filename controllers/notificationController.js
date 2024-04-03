const { default: mongoose } = require('mongoose')
const axios = require('axios')
const catchAsyncError = require('../middleware/catchAsyncError')
const admin = require('firebase-admin');
const ErrorHandler = require('../utils/errorhander')
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const serviceAccount = require('../serviceAccountKey.json'); 
const ApiFeatures = require('../utils/apifeature');
const { FCM_SERVER_KEY } = require('../constant');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.createFcmtoken = catchAsyncError(async (req, res, next)=>{
  const {fcmToken} = req.body
  const userID = new mongoose.Types.ObjectId(req.user.id)

 try {
    // Check if the user exists
    const existingUser = await userModel.findById(userID);

    if (!existingUser) {
      return next(new ErrorHandler('User not found', 404));
    }

    // Update the user's FCM token
    existingUser.fcmToken = fcmToken;
    await existingUser.save();

    res.status(201).json({ success: true, message: 'FCM token created successfully', user: existingUser || [] });
  } catch (error) {
    return next(error);
  }

})

exports.sendNotification = catchAsyncError(async (req, res, next) => {
  const { title, subtitle, message, fcmToken, orderId } = req.body;
  const userId = req.user.id;
  const data = {
      "to": `${fcmToken}`,
      "notification": {
        "body": message,
        "OrganizationId": "2",
        "content_available": true,
        "priority": "high",
        "subtitle": subtitle || "Ensellers Notification", 
        "title": title
      },
      "data": {
        "priority": "high",
        "sound": "app_sound.wav",
        "content_available": true,
        "bodyText": message,
        "organization": "Ensellers.com"
      }
    }

    try {
     const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${FCM_SERVER_KEY}`
        }
      });

      if (response.status === 200) {
        const result = await notificationModel.create({ userId, orderId, title, message });
        return res.status(200).json({ success: true, message: 'Notification sent successfully', data: result || [] });
      } else {
        if (response.data.error && response.data.error.code === 'messaging/registration-token-not-registered') {
          return next(new ErrorHandler('FCM Token is not registered', 500));
        } else {
          console.error('FCM Notification Error:', response.data);
          return next(new ErrorHandler('An error occurred while sending the notification', 500));
        }
      }
    } catch (error) {
       console.error('FCM Notification Error:', error);
      return next(new ErrorHandler('An error occurred while sending the notification', 500));
    }

  // try {
  //   const payload = {
  //     notification: {
  //       title: title,
  //       body: message
  //     },
  //     token: fcmToken,
  //   };

  //   const response = await admin.messaging().send(payload);
  //   if (response) {
  //     const result = await notificationModel.create({ userId, orderId, title, message });
  //     return res.status(200).json({ success: true, message: 'Notification sent successfully', data: result || [] });
  //   }
  // } catch (error) {
  //   if (error.code === 'messaging/registration-token-not-registered') {
  //     return next(new ErrorHandler('FCM Token is not registered', 500));
  //   } else {
  //     console.error('FCM Notification Error:', error);
  //     return next(error);
  //   }
  // }
});



exports.selfNotification = catchAsyncError(async (req, res, next) => {
  try {
      let resultPerPage;  
      if (req.query.limit) {
        resultPerPage = parseInt(req.query.limit);
      }
      
      const count = await notificationModel.countDocuments({userId: req.user.id})
      const apiFeature = new ApiFeatures(
        notificationModel.find({userId: req.user.id}).select('-__v')
        .populate({
          path: 'orderId',
          model: 'orderedProducts',
        })
        .populate({
          path: 'userId',
          model: 'User',
          select: 'avatar name email mobile'
        })
        .sort({ createdAt: -1 }),
        req.query,
        )
        .search()
        .filter()
        .pagination(resultPerPage)

      let result = await apiFeature.query
      let filteredCount = result.length

      res.status(200).json({
        success: true,
        data: result || [],
        count,
        resultPerPage,
        filteredCount,
      })
  } catch (error) {
    return next(error)
  }
})

exports.allNotification = catchAsyncError(async (req, res, next) => {
  try {
      let resultPerPage;  
      if (req.query.limit) {
        resultPerPage = parseInt(req.query.limit);
      }
      
      const count = await notificationModel.countDocuments()
      const apiFeature = new ApiFeatures(
        notificationModel.find().select('-__v')
        .populate({
          path: 'orderId',
          model: 'orderedProducts',
        })
        .populate({
          path: 'userId',
          model: 'User',
          select: 'avatar name email mobile'
        })
        .sort({ createdAt: -1 }),
        req.query,
        )
        .search()
        .filter()
        .pagination(resultPerPage)

      let result = await apiFeature.query
      let filteredCount = result.length

      res.status(200).json({
        success: true,
        data: result || [],
        count,
        resultPerPage,
        filteredCount,
      })
  } catch (error) {
    return next(error)
  }
})


exports.markRead = catchAsyncError(async (req, res, next)=>{
   try {
    const notificationId = req.params.id;
    const notification = await notificationModel.findById(notificationId);
    if (!notification) {
      return next(new ErrorHandler('Notification not found', 404));
    }
    if (notification.isRead) {
      return res.status(200).json({ success: true, message: 'Notification is already marked as read' });
    }
    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
   next(error)
  }
})