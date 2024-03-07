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
  updateShopStatus,
  getShopDetailsByShopKeeper,
} = require('../controllers/shopController')

const router = express.Router()

router.route('/shop/create-shop').post(isAuthenticated, isAuthorizeRoles('shop_keeper'), registerShop)

router
  .route('/shop/update')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper'), isAuthenticatedShop, updateShopProfile)

router
  .route('/shop/location/update')
  .put(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    updateShopLocation,
  )

router
  .route('/shop/details')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper'), isAuthenticatedShop, getShopDetailsByShopKeeper)

router
  .route('/shop/details/:id')
  .get(isAuthenticated, getShopDetails)

router
  .route('/admin/delete-shop/:id')
  .delete(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), deleteShop)

router.route('/shops/nearby').get(isAuthenticated, getNearbyShops)

router
  .route('/admin/shops')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), getAllShops)


router
  .route('/admin/update-shop/status/:id')
  .put(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), updateShopStatus)


module.exports = router
