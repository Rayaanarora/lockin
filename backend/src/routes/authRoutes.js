const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendOtp,
  verifyOtp,
  getMe,
  logout
} = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", asyncHandler(sendOtp));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.get("/me", asyncHandler(getMe));
router.post("/logout", asyncHandler(logout));

module.exports = router;
