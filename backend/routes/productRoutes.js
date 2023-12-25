const express = require("express");

const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
} = require("../middleware/auth");

const {
  createProduct,
  updateProduct,
} = require("../controllers/productController");

const router = express.Router();

router
  .route("/shop/product/new")
  .post(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    createProduct
  );

router
  .route("/shop/product/:id")
  .put(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    updateProduct
  );

module.exports = router;
