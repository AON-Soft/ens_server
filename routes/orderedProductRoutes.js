const express = require('express')
const {
  isAuthenticated,
  isAuthorizeRoles,
  isAuthenticatedShop,
  isAuthenticatedUser,
} = require('../middleware/auth')
const {
  placeOrder,
  getAllPendingOrderByShop,
  getSingleOrderDetails,
  getAllPendingOrderByUser,
  getAllConfirmOrderByUser,
  getAllDoneOrderByUser,
  getAllOnDeliveryOrderByUser,
  getAllCancelOrderByUser,
  getAllConfirmOrderByShop,
  getAllOnDeliveryOrderByShop,
  getAllDoneOrderOrderByShop,
  getAllCancelOrderOrderByShop,
  deleteSingleOrder,
  changeOrderStatus,
  getAllOrderByShop,
  getAllOrderByUser,
  getAllOrders,
  getAllInvoice,
  getSingleInvoice,
  changePyamentStatus,
  getOrderChart,
  getAllOrderByUserId,
} = require('../controllers/orderedProductController')
const { sendPayments } = require('../middleware/sendPayments')
const { createTransaction } = require('../controllers/transactionController')

const router = express.Router()

// place order by user
router
  .route('/place/order/card/:id')
  .post(isAuthenticated, sendPayments, placeOrder, createTransaction)

// all order
router
  .route('/all/order')
  .get(
    isAuthenticated,
    getAllOrders,
  )

// all order by shop
router
  .route('/shop/all/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllOrderByShop,
  )

// all order by user
router
  .route('/shop/all/order/user')
  .get(
    isAuthenticated,
    getAllOrderByUser,
  )

// all order by ID
router
  .route('/shop/all/order/user/:id')
  .get(
    isAuthenticated,
    getAllOrderByUserId,
  )

// get single oder details
router
  .route('/details/order/:id')
  .get(isAuthenticated, getSingleOrderDetails)

// delete single oder
router
  .route('/delete/order/:id')
  .delete(isAuthenticated, deleteSingleOrder)

// change order status
router
  .route('/shop/order/status/:id')
  .put(isAuthenticated,  isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), changeOrderStatus, createTransaction)

// all invoice
router
  .route('/invoice/all')
  .get(
    isAuthenticated,
    getAllInvoice,
  )

// all invoice by shop
router
  .route('/invoice/shop/all')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllOrderByShop,
  )

// get invoice details
router
  .route('/invoice/details/:id')
  .get(
    isAuthenticated,
    getSingleInvoice,
  )

// change invoice payment status
router
  .route('/invoice/pyament/status/:id')
  .put(
    isAuthenticated,
    isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'),
    changePyamentStatus,
  )
router.route('/self/order-chart').get(isAuthenticatedUser, getOrderChart)



// pending all order by shop
router
  .route('/shop/pending/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllPendingOrderByShop,
  )

  // confirm all order by shop
router
  .route('/shop/confirm/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllConfirmOrderByShop,
  )

// On delivery all order by shop
router
  .route('/shop/delivery/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllOnDeliveryOrderByShop,
  )

// done all order by shop
router
  .route('/shop/done/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllDoneOrderOrderByShop,
  )

// cancel all order by shop
router
  .route('/shop/cancel/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllCancelOrderOrderByShop,
  )

// pending oder by user
router
  .route('/shop/pending/order/user')
  .get(
    isAuthenticated,
    isAuthorizeRoles('user'),
    getAllPendingOrderByUser,
  )

// confirm oder by user
router
  .route('/shop/confirm/order/user')
  .get(
    isAuthenticated,
    isAuthorizeRoles('user'),
    getAllConfirmOrderByUser,
  )
// on delivery oder by user
router
  .route('/shop/delivery/order/user')
  .get(
    isAuthenticated,
    isAuthorizeRoles('user'),
    getAllOnDeliveryOrderByUser,
  )

// done oder by user
router
  .route('/shop/done/order/user')
  .get(
    isAuthenticated,
    isAuthorizeRoles('user'),
    getAllDoneOrderByUser,
  )

// cancel oder by user
router
  .route('/shop/cancel/order/user')
  .get(
    isAuthenticated,
    isAuthorizeRoles('user'),
    getAllCancelOrderByUser,
  )


module.exports = router
