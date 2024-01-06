const express = require("express");

const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
  isAuthenticated
} = require("../middleware/auth");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("../controllers/productController");

const router = express.Router();

router.route("/shop/products/:id").get(isAuthenticatedUser, getAllProducts);

router
  .route("/shop/product/new")
  .post(
    isAuthenticated,
    isAuthorizeRoles("shop_keeper"),
    createProduct
  );

router
  .route("/shop/product/:id")
  .put(
    isAuthenticated,
    isAuthorizeRoles("shop_keeper"),
    updateProduct
  )
  .delete(
    isAuthenticated,
    isAuthorizeRoles("shop_keeper"),
    deleteProduct
  );

module.exports = router;
