const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const user = require("./routes/userRoutes");
const transaction = require("./routes/transactionRoutes.js");
const shop = require("./routes/shopRoutes.js");
const product = require("./routes/productRoutes.js");

const errorMiddleware = require("./middleware/error");

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/v1", user);
app.use("/api/v1", transaction);
app.use("/api/v1", shop);
app.use("/api/v1", product);

app.use(errorMiddleware);

module.exports = app;
