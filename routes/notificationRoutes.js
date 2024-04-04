const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { sendOrderNotification, createFcmtoken, selfNotification, allNotification, markRead, sendCampaignNotification, allCampaign } = require('../controllers/notificationController')
const router = express.Router()

router
  .route('/notification/create/fcm-token')
  .post(isAuthenticated, createFcmtoken)

router
  .route('/notification/send')
  .post(isAuthenticated, sendOrderNotification)

router
  .route('/notification/campagin/send')
  .post(isAuthenticated, sendCampaignNotification)

router
  .route('/notification/self')
  .get(isAuthenticated, selfNotification)

router
  .route('/notification/all')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), allNotification)

router
  .route('/notification/mark-read/:id')
  .put(isAuthenticated, markRead)

router
  .route('/campaign/all')
  .get(isAuthenticated, allCampaign)


module.exports = router
