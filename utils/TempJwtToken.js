const jwt = require("jsonwebtoken");
const { JWT_EXPIRE, JWT_SECRET } = require("../constant");

const sendTempToken = (user, statusCode, res) => {
  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });

  res.status(statusCode).json({ success: true, user, token });
};

module.exports = sendTempToken;
