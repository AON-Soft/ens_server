const express = require('express')

const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { sendPoints } = require('../middleware/sendPoints')
const {
  createTransaction,
  transactionHistory,
  getUsersBasedOnLastPointsOut,
  earningHistory,
  transactionHistoryByUserId,
  allTransactionHistory,
  earningHistoryByAdmin,
  pointOutHistory,
  shopKeeperToAgentTransfer,
  userToAgentPointsOut,
  userToShopKeeperTransfer,
} = require('../controllers/transactionController')
// const {
//   userToAgentPointsOut,
// } = require('../middleware/user-to-agent-points-out')
const { sendPointsAgentToUser } = require('../middleware/sendPointsAgentToUser')
const {
  sendPointAdminToAdminAgent,
} = require('../middleware/sendPointAdminToAdminAgent')

const router = express.Router()

router
  .route('/user/user/sendPoints')
  .post(isAuthenticated, sendPoints, createTransaction)

router
  .route('/admin/sendPoints')
  .post(
    isAuthenticated,
    isAuthorizeRoles('admin', 'super_admin'),
    sendPointAdminToAdminAgent,
    createTransaction,
  )

// router
//   .route('/user/agent/pointsOut')
//   .post(
//     isAuthenticated,
//     isAuthorizeRoles('shop_keeper', 'user'),
//     userToAgentPointsOut,
//     createTransaction,
//   )

router.post(
  '/shopkeeper/agent/transfer',
  isAuthenticated,
  isAuthorizeRoles('shop_keeper'),
  shopKeeperToAgentTransfer,
)
router.post(
  '/user/agent/pointsOut',
  isAuthenticated,
  isAuthorizeRoles('user'),
  userToAgentPointsOut,
)
router.post(
  '/user/shopkeeper/transfer',
  isAuthenticated,
  isAuthorizeRoles('user'),
  userToShopKeeperTransfer,
)

router
  .route('/self/transaction-history')
  .get(isAuthenticated, transactionHistory)

router
  .route('/transaction-history/:id')
  .get(isAuthenticated, transactionHistoryByUserId)

router
  .route('/admin/getUsers/based-on/last-points-out')
  .get(
    isAuthenticated,
    isAuthorizeRoles('admin', 'super_admin'),
    getUsersBasedOnLastPointsOut,
  )

router
  .route('/agent/user/sendPoints')
  .post(
    isAuthenticated,
    isAuthorizeRoles('agent'),
    sendPointsAgentToUser,
    createTransaction,
  )

router
  .route('/user/shop_keeper/sendPoints')
  .post(
    isAuthenticated,
    isAuthorizeRoles('user'),
    sendPointsAgentToUser,
    createTransaction,
  )

router.route('/self/earnings').get(isAuthenticated, earningHistory)

router
  .route('/admin/earnings')
  .get(
    isAuthenticated,
    isAuthorizeRoles('admin', 'super_admin'),
    earningHistoryByAdmin,
  )

router
  .route('/admin/transaction-history')
  .get(
    isAuthenticated,
    isAuthorizeRoles('admin', 'super_admin'),
    allTransactionHistory,
  )

router.route('/self/pointout-history').get(isAuthenticated, pointOutHistory)

module.exports = router
