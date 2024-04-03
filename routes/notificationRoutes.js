const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { sendNotification, createFcmtoken, selfNotification, allNotification, markRead } = require('../controllers/notificationController')
const router = express.Router()

router
  .route('/notification/create/fcm-token')
  .post(isAuthenticated, createFcmtoken)

router
  .route('/notification/send')
  .post(isAuthenticated, sendNotification)

router
  .route('/notification/self')
  .get(isAuthenticated, selfNotification)

router
  .route('/notification/all')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), allNotification)

router
  .route('/notification/mark-read/:id')
  .put(isAuthenticated, markRead)

module.exports = router
