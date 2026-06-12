const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { createUser, getUser, getLockStatus, updateUser, getLeaderboard } = require("../controllers/userController");

const router = express.Router();

router.post("/", asyncHandler(createUser));
router.get("/leaderboard", asyncHandler(getLeaderboard));
router.get("/:id", asyncHandler(getUser));
router.get("/:id/lock", asyncHandler(getLockStatus));
router.put("/:id", asyncHandler(updateUser));

module.exports = router;

