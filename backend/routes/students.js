const express = require("express");
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getParents,
} = require("../controllers/studentController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// All student routes require a valid token
router.use(authenticateToken);

// GET /api/students/parents — must come before /:id to avoid route collision
router.get("/parents", requireRole("teacher"), getParents);

// GET  /api/students
router.get("/", getStudents);

// GET  /api/students/:id
router.get("/:id", getStudentById);

// POST /api/students
router.post("/", requireRole("teacher"), createStudent);

// PUT  /api/students/:id
router.put("/:id", requireRole("teacher"), updateStudent);

// DELETE /api/students/:id
router.delete("/:id", requireRole("teacher"), deleteStudent);

module.exports = router;
