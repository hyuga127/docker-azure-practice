const express = require("express");
const router = express.Router();
const {
  recordAttendance,
  recordBulkAttendance,
  getAttendance,
  updateAttendance,
  getClassAttendance,
} = require("../controllers/attendanceController");
const { authenticateToken, requireRole } = require("../middleware/auth");

router.use(authenticateToken);

// GET  /api/attendance/class?date=&class= — must be before /:studentId
router.get("/class", requireRole("teacher"), getClassAttendance);

// POST /api/attendance/bulk
router.post("/bulk", requireRole("teacher"), recordBulkAttendance);

// POST /api/attendance
router.post("/", requireRole("teacher"), recordAttendance);

// GET  /api/attendance/:studentId
router.get("/:studentId", getAttendance);

// PUT  /api/attendance/:id
router.put("/:id", requireRole("teacher"), updateAttendance);

module.exports = router;
