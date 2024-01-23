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
} = require('../controllers/orderedProductController')

const router = express.Router()

router.route('/place/order/card/:id').post(isAuthenticated, placeOrder)

router
  .route('/shop/pending/order')
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    getAllPendingOrderByShop,
  )

router
  .route('/details/pending/order/:id')
  .get(isAuthenticated, getSingleOrderDetails)

module.exports = router
