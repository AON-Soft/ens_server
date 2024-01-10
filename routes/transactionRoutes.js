const express = require('express')

const { isAuthenticatedUser } = require('../middleware/auth')
const { sendPoints } = require('../middleware/sendPoints')
const { createTransaction } = require('../controllers/transactionController')
const { userToAgentCashOut } = require('../middleware/user-agentCashOut')

const router = express.Router()

router
  .route('/user/user/sendPoints')
  .post(isAuthenticatedUser, sendPoints, createTransaction)

router
  .route('/user/agent/pointsOut')
  .post(isAuthenticatedUser, userToAgentCashOut, createTransaction)

module.exports = router
