const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const user = require("./routes/userRoutes");

const errorMiddleware = require("./middleware/error");

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/v1", user);
app.use(errorMiddleware);

module.exports = app;
