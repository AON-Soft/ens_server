const express = require("express");

const {
  isAuthenticatedUser,
  isAuthorizeRoles,
  isAuthenticatedShop,
} = require("../middleware/auth");

const {
  registerShop,
  loginShop,
  updateShopProfile,
  getShopDetails,
  logoutShop,
  deleteShop,
} = require("../controllers/shopController");

const router = express.Router();

router
  .route("/register-shop")
  .post(isAuthenticatedUser, isAuthorizeRoles("Shop Keeper"), registerShop);

router.route("/login-shop/:id").post(loginShop);
router.route("/shop/update").put(isAuthenticatedShop, updateShopProfile);
router.route("/shop").get(isAuthenticatedShop, getShopDetails);
router.route("/logout-shop").get(logoutShop);
router
  .route("/admin/delete-shop/:id")
  .delete(isAuthenticatedUser, isAuthorizeRoles("Admin"), deleteShop);

module.exports = router;
