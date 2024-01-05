const express = require("express");

const { isAuthenticatedUser } = require("../middleware/auth");
const { sendPoints } = require("../middleware/sendPoints");
const { createTransaction } = require("../controllers/transactionController");

const router = express.Router();

router
  .route("/send/points")
  .post(isAuthenticatedUser, sendPoints, createTransaction);

module.exports = router;
