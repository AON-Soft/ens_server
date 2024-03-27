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
  getTransactionsByShopID,
  getOrdersByShopID,
  shopSerch,
  registerShopByAdmin,
  getShopsByShopID,
} = require('../controllers/shopController')

const router = express.Router()

router.route('/shop/create-shop').post(isAuthenticated, isAuthorizeRoles('shop_keeper'), registerShop)

router.route('/shop/admin/create-shop').post(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), registerShopByAdmin)

router
  .route('/shop/update')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), isAuthenticatedShop, updateShopProfile)

router
  .route('/shop/location/update')
  .put(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'),
    updateShopLocation,
  )

router
  .route('/shop/details')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper'), isAuthenticatedShop, getShopDetailsByShopKeeper)

router
  .route('/shop/details/:id')
  .get(getShopDetails)

router
  .route('/shop/transactions/:id')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getTransactionsByShopID)

router
  .route('/shop/orders/:id')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getOrdersByShopID)

router
  .route('/admin/delete-shop/:id')
  .delete(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), deleteShop)

router.route('/shops/nearby').get(getNearbyShops)

router
  .route('/admin/shops')
  .get(getAllShops)


router
  .route('/admin/update-shop/status/:id')
  .put(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), updateShopStatus)


router.route('/shop/search').get(shopSerch)

router
  .route('/shops/category/:id')
  .get(isAuthenticated, getShopsByShopID)


module.exports = router
