const express = require('express')

const {
  isAuthenticated,
  isAuthorizeRoles,
  isAuthenticatedShop,
} = require('../middleware/auth')

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require('../controllers/productController')

const router = express.Router()
//get all products by shop//
router
  .route('/shopkeeper/shop/products')
  .get(isAuthenticated, isAuthenticatedShop, getAllProducts)

router
  .route('/shop/product/new')
  .post(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    createProduct,
  )

router
  .route('/shop/product/:id')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper'), updateProduct)
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper'), deleteProduct)

module.exports = router
