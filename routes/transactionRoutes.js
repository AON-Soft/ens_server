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
const { sendPointsAgentToUser } = require('../middleware/sendPointsAgentToUser')

const router = express.Router()

router
  .route('/user/user/sendPoints')
  .post(isAuthenticated, isAuthorizeRoles('user'), sendPoints, createTransaction)

router
  .route('/user/agent/pointsOut')
  .post(isAuthenticated, isAuthorizeRoles('user'), userToAgentPointsOut, createTransaction)

router
  .route('/self/transaction-history')
  .get(isAuthenticated, transactionHistory)

router
  .route('/admin/getUsers/based-on/last-points-out')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), getUsersBasedOnLastPointsOut)

router
  .route('/agent/user/sendPoints')
  .post(isAuthenticated, isAuthorizeRoles('agent'), sendPointsAgentToUser, createTransaction)

router
  .route('/user/shop_keeper/sendPoints')
  .post(isAuthenticated, isAuthorizeRoles('user'), sendPointsAgentToUser, createTransaction)

module.exports = router
