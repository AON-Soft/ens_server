const sendTokenForShop = (shop, statusCode, res) => {
  const shopToken = shop.getJWTToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie("shopToken", shopToken, options)
    .json({ success: true, shop, shopToken });
};

module.exports = sendTokenForShop;
