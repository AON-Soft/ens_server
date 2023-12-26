const express = require("express");

const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
} = require("../middleware/auth");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("../controllers/productController");

const router = express.Router();

router.route("/shop/products/:id").get(getAllProducts);
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
  )
  .delete(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    deleteProduct
  );

module.exports = router;
