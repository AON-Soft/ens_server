const catchAsyncError = require("../middleware/catchAsyncError");
const sendPoints = require("../utils/sendPoints");
const receivePoints = require("../utils/receivePoints");

exports.addPointAdminToAgent = catchAsyncError(async (req, res, next) => {
  try {
    const { email, points } = req.body;

    if (!email || !points || isNaN(points)) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    await sendPoints(req.user.email, points, "Admin");

    try {
      await receivePoints(email, points, "Agentt");
      res.status(202).json({
        message: `Succesffully transfered ${points} points to ${email} `,
      });
    } catch (receiveError) {
      console.error("Error receiving points:", receiveError);
      await receivePoints(req.user.email, points, "Admin");
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
