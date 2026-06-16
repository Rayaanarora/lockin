const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  createMission,
  getMissionFeed,
  acceptMission,
  passMission,
  getActiveMissions,
  submitAttendance,
  approveParticipant,
  getCategories,
  getCampuses,
  submitVibeCheck
} = require("../controllers/missionController");
const { finishSession } = require("../controllers/recapController");

const router = express.Router();

router.post("/", asyncHandler(createMission));
router.get("/categories", asyncHandler(getCategories));
router.get("/campuses", asyncHandler(getCampuses));
router.get("/feed", asyncHandler(getMissionFeed));
router.get("/active/:userId", asyncHandler(getActiveMissions));
router.post("/:id/accept", asyncHandler(acceptMission));
router.post("/:id/pass", asyncHandler(passMission));
router.post("/:id/attendance", asyncHandler(submitAttendance));
router.post("/:id/finish", asyncHandler(finishSession));
router.post("/:id/vibe-check", asyncHandler(submitVibeCheck));
router.post("/:id/approve-participant", asyncHandler(approveParticipant));

module.exports = router;

