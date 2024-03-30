const express = require('express')
const { isAuthenticated } = require('../middleware/auth')
const { getAllLog } = require('../controllers/logController')

const router = express.Router()


router.route('/log/all').get(isAuthenticated, getAllLog)

module.exports = router
