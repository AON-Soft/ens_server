const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const user = require("./routes/userRoutes");
const transaction = require("./routes/transactionRoutes.js");
const shop = require("./routes/shopRoutes.js");
const product = require("./routes/productRoutes.js");
const category = require("./routes/categoryRoutes.js");

const errorMiddleware = require("./middleware/error");
const { API_PREFIX } = require("./constant.js");

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// 
// health checker
app.get(`${API_PREFIX}/api/v1/health`, (_, res) => {
  res.send("OK : Check CD");
});

app.use(`${API_PREFIX}/api/v1`, user);
app.use(`${API_PREFIX}/api/v1`, transaction);
app.use(`${API_PREFIX}/api/v1`, shop);
app.use(`${API_PREFIX}/api/v1`, product);
app.use(`${API_PREFIX}/api/v1`,         category);

app.use(errorMiddleware);

module.exports = app;
