const express = require("express");
const router = express.Router();
const {
  addScore,
  getScores,
  updateScore,
  deleteScore,
} = require("../controllers/scoreController");
const { authenticateToken, requireRole } = require("../middleware/auth");

router.use(authenticateToken);

// POST /api/scores
router.post("/", requireRole("teacher"), addScore);

// GET  /api/scores/:studentId
router.get("/:studentId", getScores);

// PUT  /api/scores/:id
router.put("/:id", requireRole("teacher"), updateScore);

// DELETE /api/scores/:id
router.delete("/:id", requireRole("teacher"), deleteScore);

module.exports = router;
