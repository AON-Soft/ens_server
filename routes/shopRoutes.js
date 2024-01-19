const express = require('express')

const {
  isAuthorizeRoles,
  isAuthenticatedShop,
  isAuthenticated,
} = require('../middleware/auth')

const {
  registerShop,
  updateShopProfile,
  getShopDetails,
  deleteShop,
  updateShopLocation,
  getNearbyShops,
  getAllShops,
} = require('../controllers/shopController')

const router = express.Router()

router.route('/shop/create-shop').post(isAuthenticated, registerShop)

router
  .route('/shop/update')
  .put(isAuthenticated, isAuthenticatedShop, updateShopProfile)

router
  .route('/shop/location/update')
  .put(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    updateShopLocation,
  )

router
  .route('/shop')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper'), getShopDetails)

router
  .route('/admin/delete-shop/:id')
  .delete(isAuthenticated, isAuthorizeRoles('admin'), deleteShop)

router.route('/shops/nearby').get(isAuthenticated, getNearbyShops)

router
  .route('/admin/shops')
  .get(isAuthenticated, isAuthorizeRoles('admin'), getAllShops)

module.exports = router
