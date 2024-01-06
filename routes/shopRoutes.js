const express = require("express");

const {
  isAuthorizeRoles,
  isAuthenticatedShop,
  isAuthenticated,
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
  .post(isAuthenticated,  registerShop);

router
  .route("/shop/update")
  .put(isAuthenticated, isAuthenticatedShop, updateShopProfile);

router
  .route("/shop/location/update")
  .put(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    updateShopLocation
  );

router
  .route("/shop")
  .get(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    getShopDetails
  );

router
  .route("/admin/delete-shop/:id")
  .delete(isAuthenticated, isAuthorizeRoles("Admin"), deleteShop);

router.route("/shops/nearby").get(isAuthenticated, getNearbyShops);

module.exports = router;
