const express = require("express");
const router = express.Router();
const { login, getMe } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me — returns profile of currently logged-in user
router.get("/me", authenticateToken, getMe);

module.exports = router;
