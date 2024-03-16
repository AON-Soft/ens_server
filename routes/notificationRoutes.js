const express = require('express')
const { isAuthenticated } = require('../middleware/auth')
const { sendNotification, createFcmtoken } = require('../controllers/notificationController')
const router = express.Router()

router
  .route('/notification/create/fcm-token')
  .post(createFcmtoken)

router
  .route('/notification/send')
  .post(isAuthenticated, sendNotification)


module.exports = router
