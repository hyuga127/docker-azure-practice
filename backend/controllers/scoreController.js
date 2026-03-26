const { pool } = require("../config/db");

const addScore = async (req, res) => {
  try {
    const { studentId, subject, score, term } = req.body;

    if (!studentId || !subject || score === undefined || score === null) {
      return res
        .status(400)
        .json({ message: "Student ID, subject, and score are required." });
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      return res
        .status(400)
        .json({ message: "Score must be a number between 0 and 10." });
    }

    const [student] = await pool.query("SELECT id FROM students WHERE id = ?", [
      studentId,
    ]);
    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const [result] = await pool.query(
      "INSERT INTO scores (student_id, subject, score, term) VALUES (?, ?, ?, ?)",
      [studentId, subject, numScore, term || "Term 1"]
    );

    const [newScore] = await pool.query("SELECT * FROM scores WHERE id = ?", [
      result.insertId,
    ]);
    res
      .status(201)
      .json({ message: "Score added successfully.", score: newScore[0] });
  } catch (error) {
    console.error("Add score error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/scores/:studentId
 * Returns all scores for a student.
 * Parents may only access their own child's scores.
 * Supports optional ?term= filtering.
 */
const getScores = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;

    const [student] = await pool.query("SELECT * FROM students WHERE id = ?", [
      studentId,
    ]);
    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (req.user.role === "parent" && student[0].parent_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    let query = "SELECT * FROM scores WHERE student_id = ?";
    const params = [studentId];

    if (term) {
      query += " AND term = ?";
      params.push(term);
    }

    query += " ORDER BY term, subject";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Get scores error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/scores/:id (teacher only)
 */
const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, score, term } = req.body;

    const [existing] = await pool.query("SELECT * FROM scores WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Score record not found." });
    }

    if (score !== undefined && score !== null) {
      const numScore = parseFloat(score);
      if (isNaN(numScore) || numScore < 0 || numScore > 10) {
        return res
          .status(400)
          .json({ message: "Score must be a number between 0 and 10." });
      }
    }

    await pool.query(
      "UPDATE scores SET subject = ?, score = ?, term = ? WHERE id = ?",
      [
        subject ?? existing[0].subject,
        score !== undefined ? parseFloat(score) : existing[0].score,
        term ?? existing[0].term,
        id,
      ]
    );

    const [updated] = await pool.query("SELECT * FROM scores WHERE id = ?", [
      id,
    ]);
    res.json({ message: "Score updated successfully.", score: updated[0] });
  } catch (error) {
    console.error("Update score error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * DELETE /api/scores/:id (teacher only)
 */
const deleteScore = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT id FROM scores WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Score record not found." });
    }

    await pool.query("DELETE FROM scores WHERE id = ?", [id]);
    res.json({ message: "Score deleted successfully." });
  } catch (error) {
    console.error("Delete score error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { addScore, getScores, updateScore, deleteScore };
