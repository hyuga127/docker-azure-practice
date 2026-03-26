const { pool } = require("../config/db");

const recordAttendance = async (req, res) => {
  try {
    const { studentId, date, status, note } = req.body;

    if (!studentId || !date || !status) {
      return res
        .status(400)
        .json({ message: "Student ID, date, and status are required." });
    }

    const validStatuses = ["present", "absent", "late"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be present, absent, or late." });
    }

    const [student] = await pool.query("SELECT id FROM students WHERE id = ?", [
      studentId,
    ]);
    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    await pool.query(
      `INSERT INTO attendance (student_id, date, status, note)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note)`,
      [studentId, date, status, note || null]
    );

    res.status(201).json({ message: "Attendance recorded successfully." });
  } catch (error) {
    console.error("Record attendance error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/attendance/bulk (teacher only)
 * Records attendance for multiple students at once for a given date.
 */
const recordBulkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ studentId, status, note }]

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ message: "Date and records array are required." });
    }

    // Insert all records in a single transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const record of records) {
        const { studentId, status, note } = record;
        await connection.query(
          `INSERT INTO attendance (student_id, date, status, note)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note)`,
          [studentId, date, status || "present", note || null]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    res
      .status(201)
      .json({ message: `Attendance saved for ${records.length} students.` });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const [student] = await pool.query("SELECT * FROM students WHERE id = ?", [
      studentId,
    ]);
    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (req.user.role === "parent" && student[0].parent_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    let query = "SELECT * FROM attendance WHERE student_id = ?";
    const params = [studentId];

    if (month && year) {
      query += " AND MONTH(date) = ? AND YEAR(date) = ?";
      params.push(month, year);
    }

    query += " ORDER BY date DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM attendance WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    await pool.query(
      "UPDATE attendance SET status = ?, note = ? WHERE id = ?",
      [
        status ?? existing[0].status,
        note !== undefined ? note : existing[0].note,
        id,
      ]
    );

    res.json({ message: "Attendance updated successfully." });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getClassAttendance = async (req, res) => {
  try {
    const { date, class: className } = req.query;

    let query = `
      SELECT a.id, a.student_id, a.date, a.status, a.note,
             s.name AS student_name, s.class
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += " AND a.date = ?";
      params.push(date);
    }
    if (className) {
      query += " AND s.class = ?";
      params.push(className);
    }

    query += " ORDER BY s.class, s.name";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Get class attendance error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  recordAttendance,
  recordBulkAttendance,
  getAttendance,
  updateAttendance,
  getClassAttendance,
};
