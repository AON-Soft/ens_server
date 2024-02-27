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
    isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'),
    updateShopLocation,
  )

router
  .route('/shop')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getShopDetails)

router
  .route('/admin/delete-shop/:id')
  .delete(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), deleteShop)

router.route('/shops/nearby').get(isAuthenticated, getNearbyShops)

router
  .route('/admin/shops')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), getAllShops)

module.exports = router
