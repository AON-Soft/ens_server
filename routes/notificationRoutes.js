const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const {
  sendOrderNotification,
  createFcmtoken,
  selfNotification,
  allNotification,
  sendCampaignNotification,
  allCampaign,
  markAdminNotificationViewed,
} = require('../controllers/notificationController')
const router = express.Router()

router
  .route('/notification/create/fcm-token')
  .post(isAuthenticated, createFcmtoken)

router.route('/notification/send').post(isAuthenticated, sendOrderNotification)

router
  .route('/notification/campagin/send')
  .post(isAuthenticated, sendCampaignNotification)

router.route('/notification/self').get(isAuthenticated, selfNotification)

router
  .route('/notification/all')
  .get(
    isAuthenticated,
    isAuthorizeRoles('admin', 'super_admin'),
    allNotification,
  )

router
  .route('/notification/admin/mark-viewed/:id')
  .put(
    isAuthenticated,
    isAuthorizeRoles('admin', 'super_admin'),
    markAdminNotificationViewed
  )

router.route('/campaign/all').get(isAuthenticated, allCampaign)

module.exports = router
