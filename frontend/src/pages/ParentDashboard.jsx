import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  studentService,
  attendanceService,
  scoreService,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [childStats, setChildStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await studentService.getAll();
        const myChildren = res.data;
        setChildren(myChildren);

        // Tải thống kê (tỷ lệ điểm danh + điểm TB) cho mỗi con song song
        const statsPromises = myChildren.map(async (child) => {
          const [attRes, scoreRes] = await Promise.all([
            attendanceService.getByStudent(child.id),
            scoreService.getByStudent(child.id),
          ]);

          const attendance = attRes.data;
          const scores = scoreRes.data;

          const presentCount = attendance.filter(
            (a) => a.status === "present"
          ).length;
          const attendanceRate =
            attendance.length > 0
              ? Math.round((presentCount / attendance.length) * 100)
              : null;

          const avgScore =
            scores.length > 0
              ? (
                  scores.reduce((sum, s) => sum + parseFloat(s.score), 0) /
                  scores.length
                ).toFixed(1)
              : null;

          return {
            id: child.id,
            attendanceRate,
            totalAttendance: attendance.length,
            avgScore,
            totalScores: scores.length,
          };
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap = {};
        statsResults.forEach((s) => {
          statsMap[s.id] = s;
        });
        setChildStats(statsMap);
      } catch (err) {
        console.error("Lỗi tải dữ liệu phụ huynh:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const getScoreClass = (score) => {
    if (!score) return "";
    const n = parseFloat(score);
    if (n >= 8) return "score-high";
    if (n >= 6) return "score-medium";
    return "score-low";
  };

  const formatGender = (gender) => {
    if (gender === "male") return "Nam";
    if (gender === "female") return "Nữ";
    return "Khác";
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Xin chào, {user?.name}! 👋</h1>
            <p className="page-subtitle">Theo dõi kết quả học tập của con em</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            Đang tải thông tin con em…
          </div>
        ) : children.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">👨‍👩‍👧</div>
              <div className="empty-text">
                Chưa có học sinh nào được liên kết với tài khoản của bạn. Vui
                lòng liên hệ nhà trường.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {children.map((child) => {
              const stats = childStats[child.id] || {};
              return (
                <div key={child.id} className="card">
                  {/* Thông tin học sinh */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 20,
                      paddingBottom: 20,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="profile-avatar"
                      style={{ width: 56, height: 56, fontSize: "1.4rem" }}
                    >
                      {child.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {child.name}
                      </h2>
                      <div className="profile-meta">
                        <span className="profile-meta-item">
                          🏛️ Lớp {child.class}
                        </span>
                        <span className="profile-meta-item">
                          {child.gender === "male" ? "👦" : "👧"}{" "}
                          {formatGender(child.gender)}
                        </span>
                        <span className="profile-meta-item">
                          🎂{" "}
                          {new Date(child.date_of_birth).toLocaleDateString(
                            "vi-VN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/student/${child.id}`)}
                    >
                      Hồ sơ đầy đủ →
                    </button>
                  </div>

                  {/* Thống kê nhanh */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px,1fr))",
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div style={miniStatStyle("#dbeafe", "#2563eb")}>
                      <div
                        style={{
                          fontSize: ".75rem",
                          color: "#2563eb",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                        }}
                      >
                        Tỷ lệ đi học
                      </div>
                      <div
                        style={{
                          fontSize: "1.6rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          marginTop: 4,
                        }}
                      >
                        {stats.attendanceRate != null
                          ? `${stats.attendanceRate}%`
                          : "—"}
                      </div>
                      <div style={{ fontSize: ".75rem", color: "#64748b" }}>
                        {stats.totalAttendance} ngày ghi nhận
                      </div>
                    </div>

                    <div style={miniStatStyle("#dcfce7", "#16a34a")}>
                      <div
                        style={{
                          fontSize: ".75rem",
                          color: "#16a34a",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                        }}
                      >
                        Điểm trung bình
                      </div>
                      <div
                        className={`score-badge ${getScoreClass(
                          stats.avgScore
                        )}`}
                        style={{
                          fontSize: "1.6rem",
                          fontWeight: 700,
                          marginTop: 4,
                        }}
                      >
                        {stats.avgScore != null ? `${stats.avgScore}/10` : "—"}
                      </div>
                      <div style={{ fontSize: ".75rem", color: "#64748b" }}>
                        {stats.totalScores} môn học
                      </div>
                    </div>
                  </div>

                  {/* Liên kết nhanh */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        navigate(`/student/${child.id}?tab=scores`)
                      }
                    >
                      📊 Xem điểm số
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        navigate(`/student/${child.id}?tab=attendance`)
                      }
                    >
                      📋 Xem điểm danh
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const miniStatStyle = (bg, color) => ({
  background: bg,
  borderRadius: 10,
  padding: "16px",
  border: `1px solid ${color}30`,
});

export default ParentDashboard;
