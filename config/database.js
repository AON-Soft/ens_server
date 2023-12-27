const mongoose = require("mongoose");
const { MONGO_URI } = require("../constant");

const connectDatabase = () => {


  mongoose
    .connect(MONGO_URI)
    .then((data) => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
};

module.exports = connectDatabase;
