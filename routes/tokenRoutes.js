const express = require('express')
const { isAuthenticated } = require('../middleware/auth')

const {
  createToken,
  getSingleTokenDetails,
  getAllToken,
} = require('../controllers/tokenController')
const { setUpToken } = require('../middleware/setUpToken')
const { createTransaction } = require('../controllers/transactionController')

const router = express.Router()

router
  .route('/token/new')
  .post(isAuthenticated, setUpToken, createToken, createTransaction)

router
  .route('/get/single/token/:id')
  .get(isAuthenticated, getSingleTokenDetails)

router.route('/get/allToken').get(isAuthenticated, getAllToken)

module.exports = router
