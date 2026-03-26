const { pool } = require("../config/db");

const getStudents = async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === "teacher") {
      query = `
        SELECT s.*, u.name AS parent_name, u.email AS parent_email
        FROM students s
        LEFT JOIN users u ON s.parent_id = u.id
        ORDER BY s.class, s.name
      `;
      params = [];
    } else {
      query = `
        SELECT s.*, u.name AS parent_name, u.email AS parent_email
        FROM students s
        LEFT JOIN users u ON s.parent_id = u.id
        WHERE s.parent_id = ?
        ORDER BY s.name
      `;
      params = [req.user.id];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT s.*, u.name AS parent_name, u.email AS parent_email
       FROM students s
       LEFT JOIN users u ON s.parent_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const student = rows[0];

    if (req.user.role === "parent" && student.parent_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json(student);
  } catch (error) {
    console.error("Get student by id error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, class: className, parentId } = req.body;

    if (!name || !dateOfBirth || !gender || !className) {
      return res.status(400).json({
        message: "Name, date of birth, gender, and class are required.",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO students (name, date_of_birth, gender, class, parent_id) VALUES (?, ?, ?, ?, ?)",
      [name, dateOfBirth, gender, className, parentId || null]
    );

    const [newStudent] = await pool.query(
      `SELECT s.*, u.name AS parent_name, u.email AS parent_email
       FROM students s
       LEFT JOIN users u ON s.parent_id = u.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Student created successfully.",
      student: newStudent[0],
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dateOfBirth, gender, class: className, parentId } = req.body;

    const [existing] = await pool.query("SELECT * FROM students WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const current = existing[0];

    await pool.query(
      "UPDATE students SET name = ?, date_of_birth = ?, gender = ?, class = ?, parent_id = ? WHERE id = ?",
      [
        name ?? current.name,
        dateOfBirth ?? current.date_of_birth,
        gender ?? current.gender,
        className ?? current.class,
        parentId !== undefined ? parentId || null : current.parent_id,
        id,
      ]
    );

    const [updated] = await pool.query(
      `SELECT s.*, u.name AS parent_name, u.email AS parent_email
       FROM students s
       LEFT JOIN users u ON s.parent_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    res.json({ message: "Student updated successfully.", student: updated[0] });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      "SELECT id FROM students WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    await pool.query("DELETE FROM students WHERE id = ?", [id]);
    res.json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getParents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'parent' ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    console.error("Get parents error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getParents,
};
