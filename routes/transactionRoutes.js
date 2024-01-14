const express = require('express')

const { isAuthenticated } = require('../middleware/auth')
const { sendPoints } = require('../middleware/sendPoints')
const {
  createTransaction,
  transactionHistory,
} = require('../controllers/transactionController')
const {
  userToAgentPointsOut,
} = require('../middleware/user-to-agent-points-out')

const router = express.Router()

router
  .route('/user/user/sendPoints')
  .post(isAuthenticated, sendPoints, createTransaction)

router
  .route('/user/agent/pointsOut')
  .post(isAuthenticated, userToAgentPointsOut, createTransaction)

router
  .route('/self/transaction-history')
  .get(isAuthenticated, transactionHistory)

module.exports = router
