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
  getPrductsByShopID,
  getTransactionsByShopID,
  getOrdersByShopID,
  shopSerch,
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
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getShopDetails)

router
  .route('/shop/products/:id')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getPrductsByShopID)

router
  .route('/shop/transactions/:id')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getTransactionsByShopID)

router
  .route('/shop/orders/:id')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getOrdersByShopID)

router
  .route('/admin/delete-shop/:id')
  .delete(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), deleteShop)

router.route('/shops/nearby').get(isAuthenticated, getNearbyShops)

router
  .route('/admin/shops')
  .get(isAuthenticated, getAllShops)


router
  .route('/admin/update-shop/status/:id')
  .put(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), updateShopStatus)


router.route('/shop/search').get(shopSerch)

module.exports = router
