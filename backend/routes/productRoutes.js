const express = require("express");

const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
} = require("../middleware/auth");

const { createProduct } = require("../controllers/productController");

const router = express.Router();

router
  .route("/shop/product/new")
  .post(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    createProduct
  );

module.exports = router;
