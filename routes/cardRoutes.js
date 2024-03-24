const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const {
  createCard,
  increaseQuantity,
  decreaseQuantity,
  removeFromCard,
  getCard,
  getCardByAdmin,
  removeProductFromCard,
} = require('../controllers/cardController')
const { existcard } = require('../middleware/existcard')

const router = express.Router()

router
  .route('/card/new/product/:id')
  .post(isAuthenticated, existcard, createCard)

router
  .route('/card/increaseQuantity/product/:id')
  .put(isAuthenticated, increaseQuantity)

router
  .route('/card/decreaseQuantity/product/:id')
  .put(isAuthenticated, decreaseQuantity)

router.route('/card/remove/:id').delete(isAuthenticated, removeFromCard)

router.route('/card/remove/product/:id').delete(isAuthenticated, existcard, removeProductFromCard)

router.route('/user/getCard').get(isAuthenticated, getCard)

router
  .route('/admin/getCard/user/:id')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), getCardByAdmin)

module.exports = router
