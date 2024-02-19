const express = require('express')
const { isAuthenticated } = require('../middleware/auth')
const { sendNotification } = require('../controllers/notificationController')
const router = express.Router()

router
  .route('/notification/send')
  .post(isAuthenticated, sendNotification)


module.exports = router
