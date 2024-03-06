const express = require('express')

const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsByShop,
  getAllProductsByUser,
  adminGetAllProductsByShop,
  getSingleProduct,
} = require('../controllers/productController')

const router = express.Router()
//get all products by shop//
router
  .route('/shopkeeper/shop/products')
  .get(isAuthenticated, getAllProductsByShop)

router
  .route('/admin/products/shop/:id')
  .get(isAuthenticated, isAuthorizeRoles('admin'), adminGetAllProductsByShop)

router
  .route('/user/products/shop/:id')
  .get(isAuthenticated, getAllProductsByUser)

router
  .route('/shop/product/new')
  .post(isAuthenticated, isAuthorizeRoles('shop_keeper'), createProduct)

router
  .route('/shop/product/:id')
  .get(getSingleProduct)
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper'), updateProduct)
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper'), deleteProduct)

module.exports = router
