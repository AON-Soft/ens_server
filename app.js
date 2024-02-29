const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const fileUpload = require('express-fileupload')

const user = require('./routes/userRoutes')
const transaction = require('./routes/transactionRoutes.js')
const shop = require('./routes/shopRoutes.js')
const product = require('./routes/productRoutes.js')
const category = require('./routes/categoryRoutes.js')
const brand = require('./routes/brandRoutes.js')
const shopCategory = require('./routes/shopCategoryRoutes.js')
const card = require('./routes/cardRoutes.js')
const token = require('./routes/tokenRoutes.js')
const orderedProducts = require('./routes/orderedProductRoutes.js')
const notification = require('./routes/notificationRoutes.js')
const location = require('./routes/locationRoutes.js')

const errorMiddleware = require('./middleware/error')
const { API_PREFIX } = require('./constant.js')

app.use(cors());
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))

//
// health checker
app.get(`${API_PREFIX}/api/v1/health`, (_, res) => {
  res.send('OK : Check CD')
})

app.use(`${API_PREFIX}/api/v1`, user)
app.use(`${API_PREFIX}/api/v1`, transaction)
app.use(`${API_PREFIX}/api/v1`, shop)
app.use(`${API_PREFIX}/api/v1`, product)
app.use(`${API_PREFIX}/api/v1`, category)
app.use(`${API_PREFIX}/api/v1`, brand)
app.use(`${API_PREFIX}/api/v1`, shopCategory)
app.use(`${API_PREFIX}/api/v1`, card)
app.use(`${API_PREFIX}/api/v1`, token)
app.use(`${API_PREFIX}/api/v1`, orderedProducts)
app.use(`${API_PREFIX}/api/v1`, notification)
app.use(`${API_PREFIX}/api/v1`, location)

app.use(errorMiddleware)

module.exports = app
