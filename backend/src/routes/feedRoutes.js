const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { getFeed, getUserFeed } = require("../controllers/feedController");

const router = express.Router();

router.get("/", asyncHandler(getFeed));
router.get("/user/:userId", asyncHandler(getUserFeed));

module.exports = router;
