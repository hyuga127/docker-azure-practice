import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  studentService,
  attendanceService,
  scoreService,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [scores, setScores] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studentRes, attRes, scoreRes] = await Promise.all([
          studentService.getById(id),
          attendanceService.getByStudent(id),
          scoreService.getByStudent(id),
        ]);
        setStudent(studentRes.data);
        setAttendance(attRes.data);
        setScores(scoreRes.data);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? "Bạn không có quyền xem thông tin này."
            : "Không tìm thấy học sinh."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  // Thống kê điểm danh
  const attendanceStats = React.useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [attendance]);

  // Điểm trung bình
  const avgScore = React.useMemo(() => {
    if (scores.length === 0) return null;
    return (
      scores.reduce((s, r) => s + parseFloat(r.score), 0) / scores.length
    ).toFixed(1);
  }, [scores]);

  // Nhóm điểm theo học kỳ
  const scoresByTerm = React.useMemo(() => {
    return scores.reduce((acc, s) => {
      if (!acc[s.term]) acc[s.term] = [];
      acc[s.term].push(s);
      return acc;
    }, {});
  }, [scores]);

  const getScoreColor = (score) => {
    const n = parseFloat(score);
    if (n >= 8) return "var(--success)";
    if (n >= 6) return "var(--warning)";
    return "var(--danger)";
  };

  const calcAge = (dob) =>
    Math.floor(
      (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );

  const formatGender = (g) =>
    g === "male" ? "Nam" : g === "female" ? "Nữ" : "Khác";

  const formatStatus = (status) => {
    if (status === "present") return "Có mặt";
    if (status === "absent") return "Vắng mặt";
    if (status === "late") return "Đi muộn";
    return status;
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <div className="loading-spinner">
            <div className="spinner" />
            Đang tải hồ sơ…
          </div>
        </main>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <div className="empty-text">
                {error || "Không tìm thấy học sinh."}
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(-1)}
              >
                Quay lại
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          {user?.role === "teacher" && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/teacher/students/${student.id}/edit`)}
            >
              ✏️ Chỉnh sửa học sinh
            </button>
          )}
        </div>

        {/* Tiêu đề hồ sơ */}
        <div className="profile-header">
          <div className="profile-avatar">{student.name[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <h2
              style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}
            >
              {student.name}
            </h2>
            <div className="profile-meta">
              <span className="profile-meta-item">
                🏛️ Lớp <strong>{student.class}</strong>
              </span>
              <span className="profile-meta-item">
                {student.gender === "male" ? "👦" : "👧"}{" "}
                {formatGender(student.gender)}
              </span>
              <span className="profile-meta-item">
                🎂 {calcAge(student.date_of_birth)} tuổi
              </span>
              <span className="profile-meta-item">
                📅 Ngày sinh:{" "}
                {new Date(student.date_of_birth).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                {attendanceStats.rate}%
              </div>
              <div
                style={{ fontSize: ".75rem", color: "var(--text-secondary)" }}
              >
                Tỷ lệ đi học
              </div>
            </div>
            {avgScore && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: getScoreColor(avgScore),
                  }}
                >
                  {avgScore}
                </div>
                <div
                  style={{ fontSize: ".75rem", color: "var(--text-secondary)" }}
                >
                  Điểm TB
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {["info", "scores", "attendance"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "info" && "👤 Thông tin"}
              {tab === "scores" && `📊 Điểm số (${scores.length})`}
              {tab === "attendance" && `📋 Điểm danh (${attendance.length})`}
            </button>
          ))}
        </div>

        {/* ── Tab Thông tin ── */}
        {activeTab === "info" && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Thông tin học sinh</h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
              }}
            >
              {[
                { label: "Họ và tên", value: student.name },
                {
                  label: "Ngày sinh",
                  value: new Date(student.date_of_birth).toLocaleDateString(
                    "vi-VN",
                    { year: "numeric", month: "long", day: "numeric" }
                  ),
                },
                {
                  label: "Tuổi",
                  value: `${calcAge(student.date_of_birth)} tuổi`,
                },
                { label: "Giới tính", value: formatGender(student.gender) },
                { label: "Lớp", value: `Lớp ${student.class}` },
                { label: "Mã học sinh", value: `#${student.id}` },
                {
                  label: "Phụ huynh / Người giám hộ",
                  value: student.parent_name || "Chưa được gán",
                },
                {
                  label: "Email phụ huynh",
                  value: student.parent_email || "—",
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: ".95rem",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab Điểm số ── */}
        {activeTab === "scores" && (
          <div>
            {scores.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <div className="empty-text">
                    Chưa có điểm nào được ghi nhận.
                  </div>
                </div>
              </div>
            ) : (
              Object.entries(scoresByTerm).map(([term, termScores]) => {
                const termAvg = (
                  termScores.reduce((s, r) => s + parseFloat(r.score), 0) /
                  termScores.length
                ).toFixed(1);
                return (
                  <div key={term} className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                      <h3 className="card-title">{term}</h3>
                      <span
                        style={{
                          fontSize: ".85rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Điểm TB:{" "}
                        <strong style={{ color: getScoreColor(termAvg) }}>
                          {termAvg}/10
                        </strong>
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {termScores.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "#fafafa",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: ".8rem",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                              marginBottom: 6,
                            }}
                          >
                            {s.subject}
                          </div>
                          <div
                            style={{
                              fontSize: "1.6rem",
                              fontWeight: 700,
                              color: getScoreColor(s.score),
                            }}
                          >
                            {parseFloat(s.score).toFixed(1)}
                          </div>
                          <div
                            style={{
                              fontSize: ".7rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            / 10
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab Điểm danh ── */}
        {activeTab === "attendance" && (
          <div>
            {/* Tóm tắt */}
            <div className="stats-grid" style={{ marginBottom: 16 }}>
              {[
                {
                  label: "Tổng số ngày",
                  value: attendanceStats.total,
                  color: "blue",
                  icon: "📅",
                },
                {
                  label: "Có mặt",
                  value: attendanceStats.present,
                  color: "green",
                  icon: "✅",
                },
                {
                  label: "Vắng mặt",
                  value: attendanceStats.absent,
                  color: "red",
                  icon: "❌",
                },
                {
                  label: "Đi muộn",
                  value: attendanceStats.late,
                  color: "yellow",
                  icon: "⏰",
                },
                {
                  label: "Tỷ lệ đi học",
                  value: `${attendanceStats.rate}%`,
                  color: "cyan",
                  icon: "📈",
                },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="stat-card">
                  <div className={`stat-icon ${color}`}>{icon}</div>
                  <div>
                    <div className="stat-value">{value}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {attendance.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-text">Chưa có dữ liệu điểm danh.</div>
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Thứ</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500 }}>
                          {new Date(a.date).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            textTransform: "capitalize",
                          }}
                        >
                          {new Date(a.date).toLocaleDateString("vi-VN", {
                            weekday: "long",
                          })}
                        </td>
                        <td>
                          <span className={`badge badge-${a.status}`}>
                            {formatStatus(a.status)}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {a.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentProfile;
