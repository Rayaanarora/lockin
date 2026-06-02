const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  createMission,
  getMissionFeed,
  acceptMission,
  passMission,
  getActiveMissions,
  submitAttendance
} = require("../controllers/missionController");

const router = express.Router();

router.post("/", asyncHandler(createMission));
router.get("/feed", asyncHandler(getMissionFeed));
router.get("/active/:userId", asyncHandler(getActiveMissions));
router.post("/:id/accept", asyncHandler(acceptMission));
router.post("/:id/pass", asyncHandler(passMission));
router.post("/:id/attendance", asyncHandler(submitAttendance));

module.exports = router;

