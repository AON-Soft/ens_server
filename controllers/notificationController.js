const { default: mongoose } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const ErrorHandler = require('../utils/errorhander')
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const ApiFeatures = require('../utils/apifeature');
const sendNotification = require('../utils/sendNotification');

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

exports.sendOrderNotification = catchAsyncError(async (req, res, next) => {
  const { title, subtitle, message, fcmToken, orderId } = req.body;
  const userId = req.user.id;
  const payload = {
    title, 
    subtitle, 
    message, 
    fcmToken, 
    userId, 
    orderId
  }
   try {
        const result = await sendNotification(payload);
        res.status(200).json(result);
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }

});

exports.sendCampaignNotification = catchAsyncError(async (req, res, next) => {
  const { title, subtitle, message, fcmToken, orderId } = req.body;
  const userId = req.user.id;
  const payload = {
    title, 
    subtitle, 
    message, 
    fcmToken, 
    userId, 
    orderId
  }
   try {
        const result = await sendNotification(payload);
        res.status(200).json(result);
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }

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
        .populate('orderId')
        .populate('campaignId')
        .populate({
          path: 'userId',
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
        .populate('orderId')
        .populate('campaignId')
        .populate({
          path: 'userId',
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