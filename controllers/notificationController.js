const { default: mongoose } = require('mongoose')
const axios = require('axios')
const catchAsyncError = require('../middleware/catchAsyncError')
const ErrorHandler = require('../utils/errorhander')
const notificationModel = require('../models/notificationModel')
const userModel = require('../models/userModel')
const ApiFeatures = require('../utils/apifeature')
const sendNotification = require('../utils/sendNotification')
const { FCM_SERVER_KEY } = require('../constant')
const campaignModel = require('../models/campaignModel')

exports.createFcmtoken = catchAsyncError(async (req, res, next) => {
  const { fcmToken } = req.body
  const userID = new mongoose.Types.ObjectId(req.user.id)

  try {
    // Check if the user exists
    const existingUser = await userModel.findById(userID)

    if (!existingUser) {
      return next(new ErrorHandler('User not found', 404))
    }

    // Update the user's FCM token
    existingUser.fcmToken = fcmToken
    await existingUser.save()

    res.status(201).json({
      success: true,
      message: 'FCM token created successfully',
      user: existingUser || [],
    })
  } catch (error) {
    return next(error)
  }
})

exports.sendOrderNotification = catchAsyncError(async (req, res, next) => {
  const { title, subtitle, message, fcmToken, orderId } = req.body
  const userId = req.user.id
  const payload = {
    title,
    subtitle,
    message,
    fcmToken,
    userId,
    orderId,
  }
  try {
    const result = await sendNotification(payload)
    res.status(200).json(result)
  } catch (error) {
    next(new ErrorHandler(error.message, 500))
  }
})

exports.sendCampaignNotification = catchAsyncError(async (req, res, next) => {
  const { title, subtitle, message, fcmToken, orderId } = req.body
  const userId = req.user.id
  const payload = {
    title,
    subtitle,
    message,
    fcmToken,
    userId,
    orderId,
  }
  try {
    const result = await sendNotification(payload)
    res.status(200).json(result)
  } catch (error) {
    next(new ErrorHandler(error.message, 500))
  }
})

exports.sendCampaignNotification = async (req, res, next) => {
  try {
    const { campaignTitle, title, body, payload, bgImage } = req.body

    // Create the campaign
    const newCampaign = await campaignModel.create({
      campaignTitle: campaignTitle,
      title: title,
      body: body,
      bgImage: bgImage || null,
      payload: payload,
    })

    // Fetch all users and their FCM tokens in batches
    const batchSize = 100
    let offset = 0
    let usersBatch = await userModel
      .find({ fcmToken: { $exists: true } }, 'fcmToken')
      .skip(offset)
      .limit(batchSize)

    // Prepare notification payload
    const notificationPayload = {
      notification: {
        body: body,
        OrganizationId: '2',
        content_available: true,
        priority: 'high',
        subtitle: payload.subtitle || 'Ensellers Notification',
        title: title,
      },
      data: {
        priority: 'high',
        sound: 'app_sound.wav',
        content_available: true,
        bodyText: campaignTitle,
        organization: 'Ensellers.com',
      },
    }

    // Send notifications and update campaign stats
    const notifications = []
    while (usersBatch.length > 0) {
      const notificationRequests = usersBatch.map((user) => {
        return axios.post(
          'https://fcm.googleapis.com/fcm/send',
          { ...notificationPayload, to: user.fcmToken },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: FCM_SERVER_KEY,
            },
          },
        )
      })

      // Send notification requests in parallel
      const responses = await Promise.all(notificationRequests)

      // Update campaign stats
      const totalSent = responses.filter(
        (response) => response.status === 200,
      ).length
      const totalFailed = responses.length - totalSent
      const totalProcessed = responses.length

      // Update campaign document with new stats
      await campaignModel.findByIdAndUpdate(newCampaign._id, {
        $inc: {
          total: totalProcessed,
          total_sent: totalSent,
          total_failed: totalFailed,
        },
      })

      // Save data to Notification model
      for (let i = 0; i < responses.length; i++) {
        const user = usersBatch[i]
        const response = responses[i]
        const notification = await notificationModel.create({
          userId: user._id,
          campaignId: newCampaign._id,
          status: response.status === 200 ? 'success' : 'failed',
          notificationType: 'campaign',
        })
        notifications.push(notification)
      }

      // Fetch next batch of users
      offset += batchSize
      usersBatch = await userModel
        .find({ fcmToken: { $exists: true } })
        .skip(offset)
        .limit(batchSize)
    }

    res.status(200).json({
      success: true,
      message: 'Campaign created and notifications sent successfully',
      notifications,
    })
  } catch (error) {
    console.error('Error sending campaign notifications:', error)
    next(error)
  }
}

exports.selfNotification = catchAsyncError(async (req, res, next) => {
  try {
    let resultPerPage
    if (req.query.limit) {
      resultPerPage = parseInt(req.query.limit)
    }

    const count = await notificationModel.countDocuments({
      userId: req.user.id,
    })
    const apiFeature = new ApiFeatures(
      notificationModel
        .find({ userId: req.user.id })
        .select('-__v')
        .populate('orderId')
        .populate('campaignId')
        .populate({
          path: 'userId',
          select: 'avatar name email mobile',
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

exports.markAdminNotificationViewed = catchAsyncError(
  async (req, res, next) => {
    try {
      const notificationId = req.params.id
      const notification = await notificationModel.findById(notificationId)
      if (!notification) {
        return next(new ErrorHandler('Notification not found', 404))
      }
      if (notification.isAdminNotification && !notification.isViewedByAdmin) {
        notification.isViewedByAdmin = true
        await notification.save()
      }
      return res
        .status(200)
        .json({ success: true, message: 'Admin notification marked as viewed' })
    } catch (error) {
      next(error)
    }
  },
)

exports.allNotification = catchAsyncError(async (req, res, next) => {
  try {
    let resultPerPage = 10
    if (req.query.limit) {
      resultPerPage = parseInt(req.query.limit)
    }

    let filter = {}
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admin users can see all notifications
      filter = {}
    } else {
      // Regular users can only see their own non-admin notifications
      filter = { userId: req.user.id, isAdminNotification: false }
    }

    const count = await notificationModel.countDocuments(filter)
    const apiFeature = new ApiFeatures(
      notificationModel
        .find(filter)
        .select('-__v')
        .populate('orderId')
        .populate('campaignId')
        .populate({
          path: 'userId',
          select: 'avatar name email mobile',
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

exports.allCampaign = catchAsyncError(async (req, res, next) => {
  try {
    let resultPerPage
    if (req.query.limit) {
      resultPerPage = parseInt(req.query.limit)
    }

    const count = await campaignModel.countDocuments()
    const apiFeature = new ApiFeatures(
      campaignModel.find().select('-__v').sort({ createdAt: -1 }),
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
