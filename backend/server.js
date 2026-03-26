require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { connectDB, pool } = require("./config/db");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");
const scoreRoutes = require("./routes/scores");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/scores", scoreRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: "Internal server error." });
});

// ── Seed Database ───────────────────────────────────────────────────────────────
/**
 * Populates the database with demo accounts and sample data
 * only when the users table is empty (fresh install).
 */
const seedDatabase = async () => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS count FROM users");
    if (rows[0].count > 0) return;

    console.log("🌱 Seeding initial demo data...");

    const hash = await bcrypt.hash("password123", 10);

    // Create demo users
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES
       ('Ms. Johnson', 'teacher@school.com', ?, 'teacher'),
       ('Mr. Smith',   'teacher2@school.com', ?, 'teacher'),
       ('Alice Parker', 'parent@school.com', ?, 'parent'),
       ('Bob Williams', 'parent2@school.com', ?, 'parent')`,
      [hash, hash, hash, hash]
    );

    const [parents] = await pool.query(
      "SELECT id FROM users WHERE role = 'parent' ORDER BY id"
    );
    const p1 = parents[0].id;
    const p2 = parents[1].id;

    // Create sample students
    await pool.query(
      `INSERT INTO students (name, date_of_birth, gender, class, parent_id) VALUES
       ('Emma Parker',    '2015-03-15', 'female', '3A', ?),
       ('Liam Parker',    '2016-07-22', 'male',   '2B', ?),
       ('Sophia Williams','2015-11-08', 'female', '3A', ?),
       ('Noah Johnson',   '2017-01-30', 'male',   '1C', NULL),
       ('Olivia Brown',   '2016-05-12', 'female', '2B', NULL)`,
      [p1, p1, p2, null, null]
    );

    const [students] = await pool.query("SELECT id FROM students ORDER BY id");
    const subjects = ["Math", "English", "Science", "History", "Arts"];
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 172800000)
      .toISOString()
      .split("T")[0];

    for (const student of students) {
      // Seed attendance for last 3 days
      const statuses = ["present", "present", "absent", "late"];
      await pool.query(
        "INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = status",
        [student.id, today, "present"]
      );
      await pool.query(
        "INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = status",
        [
          student.id,
          yesterday,
          statuses[Math.floor(Math.random() * statuses.length)],
        ]
      );
      await pool.query(
        "INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = status",
        [student.id, twoDaysAgo, "present"]
      );

      // Seed scores for Term 1
      for (const subject of subjects) {
        const score = parseFloat((Math.random() * 4 + 6).toFixed(1)); // 6.0 – 10.0
        await pool.query(
          "INSERT INTO scores (student_id, subject, score, term) VALUES (?, ?, ?, ?)",
          [student.id, subject, score, "Term 1"]
        );
      }
    }

    console.log("✅ Database seeded successfully!");
    console.log("──────────────────────────────────────────");
    console.log("  Demo Credentials (password: password123)");
    console.log("  Teacher : teacher@school.com");
    console.log("  Teacher : teacher2@school.com");
    console.log("  Parent  : parent@school.com");
    console.log("  Parent  : parent2@school.com");
    console.log("──────────────────────────────────────────");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  }
};

// ── Start Server ───────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
