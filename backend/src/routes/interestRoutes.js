const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  getInterestCategories,
  saveInterests,
  getUserInterests,
  updateUserInterests
} = require("../controllers/interestController");

const router = express.Router();

router.get("/categories", asyncHandler(getInterestCategories));
router.post("/", asyncHandler(saveInterests));
router.get("/:userId", asyncHandler(getUserInterests));
router.put("/:userId", asyncHandler(updateUserInterests));

module.exports = router;
