const express = require('express')

const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { sendPoints } = require('../middleware/sendPoints')
const {
  createTransaction,
  transactionHistory,
  getUsersBasedOnLastPointsOut,
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

router
  .route('/admin/getUsers/based-on/last-points-out')
  .get(isAuthenticated, isAuthorizeRoles('admin'), getUsersBasedOnLastPointsOut)

module.exports = router
