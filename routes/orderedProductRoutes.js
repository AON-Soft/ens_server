const express = require('express')
const {
  isAuthenticated,
  isAuthorizeRoles,
  isAuthenticatedShop,
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
} = require('../controllers/orderedProductController')

const router = express.Router()

// place order by user
router.route('/place/order/card/:id').post(isAuthenticated, placeOrder)

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

  // pending oder details by shop
router
  .route('/details/pending/order/:id')
  .get(isAuthenticated, getSingleOrderDetails)

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
