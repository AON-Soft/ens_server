const express = require('express')
const {isAuthenticated} = require('../middleware/auth')
const { createLocatiion, updateLocation, deleteLocation, getAllLocation, getSelfLocation } = require('../controllers/locationController')

const router = express.Router()

router
  .route('/location/create')
  .post(isAuthenticated, createLocatiion)

router
  .route('/location/:id')
  .put(isAuthenticated, updateLocation)
  .delete(isAuthenticated, deleteLocation)

router
  .route('/location/all')
  .get(isAuthenticated, getAllLocation)

router
  .route('/location/self')
  .get(isAuthenticated, getSelfLocation)

module.exports = router
