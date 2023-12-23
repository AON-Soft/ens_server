const express = require("express");

const { isAuthenticatedUser, isAuthorizeRoles } = require("../middleware/auth");
const {
  addPointAdminToAgent,
} = require("../controllers/transactionController");

const router = express.Router();

router
  .route("/admin-to-agent/pointAdd")
  .post(isAuthenticatedUser, isAuthorizeRoles("Admin"), addPointAdminToAgent);

module.exports = router;
