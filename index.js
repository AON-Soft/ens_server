const app = require("./app");

const dotenv = require("dotenv");
dotenv.config({ });

const connectDatabase = require("./config/database");
const { PORT } = require("./constant");

//Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);

  throw Error("Server Not Running...")
});

connectDatabase();

const server = app.listen(PORT, () => {
  console.log(`Server is working on http://localhost:${PORT}`);
});

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promis Rejection`);

  server.close(() => {
    throw Error("Server Not Running...")
  });
});
