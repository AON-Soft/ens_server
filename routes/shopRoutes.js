const express = require("express");

const {
  isAuthenticatedUser,
  isAuthorizeRoles,
  isAuthenticatedShop,
} = require("../middleware/auth");

const {
  registerShop,
  updateShopProfile,
  getShopDetails,
  deleteShop,
  updateShopLocation,
  getNearbyShops,
} = require("../controllers/shopController");

const router = express.Router();

router
  .route("/register-shop")
  .post(isAuthenticatedUser, isAuthorizeRoles("Shop Keeper"), registerShop);

router
  .route("/shop/update")
  .put(isAuthenticatedUser, isAuthenticatedShop, updateShopProfile);

router
  .route("/shop/location/update")
  .put(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    updateShopLocation
  );

router
  .route("/shop")
  .get(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    getShopDetails
  );

router
  .route("/admin/delete-shop/:id")
  .delete(isAuthenticatedUser, isAuthorizeRoles("Admin"), deleteShop);

router.route("/shops/nearby").get(isAuthenticatedUser, getNearbyShops);

module.exports = router;
