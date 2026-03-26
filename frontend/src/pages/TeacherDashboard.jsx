import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { studentService, attendanceService } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    classes: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          studentService.getAll(),
          attendanceService.getByClass({
            date: new Date().toISOString().split("T")[0],
          }),
        ]);

        const students = studentsRes.data;
        const todayAttendance = attendanceRes.data;

        const classes = new Set(students.map((s) => s.class)).size;
        const present = todayAttendance.filter(
          (a) => a.status === "present"
        ).length;
        const absent = todayAttendance.filter(
          (a) => a.status === "absent"
        ).length;
        const late = todayAttendance.filter((a) => a.status === "late").length;

        setStats({
          totalStudents: students.length,
          presentToday: present,
          absentToday: absent,
          lateToday: late,
          classes,
        });
        setRecentStudents(students.slice(0, 5));
      } catch (err) {
        console.error("Lỗi tải dữ liệu bảng điều khiển:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickLinks = [
    {
      icon: "👨‍🎓",
      title: "Quản lý Học sinh",
      desc: "Xem, thêm, sửa, xóa học sinh",
      path: "/teacher/students",
    },
    {
      icon: "📋",
      title: "Điểm danh",
      desc: "Điểm danh hàng ngày",
      path: "/teacher/attendance",
    },
    {
      icon: "📊",
      title: "Nhập điểm số",
      desc: "Nhập và quản lý điểm",
      path: "/teacher/scores",
    },
  ];

  // Format ngày theo tiếng Việt
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Chào mừng, {user?.name}! 👋</h1>
            <p
              className="page-subtitle"
              style={{ textTransform: "capitalize" }}
            >
              {today}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            Đang tải dữ liệu…
          </div>
        ) : (
          <>
            {/* Thống kê */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">👨‍🎓</div>
                <div>
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Tổng học sinh</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon cyan">🏛️</div>
                <div>
                  <div className="stat-value">{stats.classes}</div>
                  <div className="stat-label">Lớp học</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">✅</div>
                <div>
                  <div className="stat-value">{stats.presentToday}</div>
                  <div className="stat-label">Có mặt hôm nay</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">❌</div>
                <div>
                  <div className="stat-value">{stats.absentToday}</div>
                  <div className="stat-label">Vắng mặt hôm nay</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon yellow">⏰</div>
                <div>
                  <div className="stat-value">{stats.lateToday}</div>
                  <div className="stat-label">Đi muộn hôm nay</div>
                </div>
              </div>
            </div>

            {/* Thao tác nhanh */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h2 className="card-title">Thao tác nhanh</h2>
              </div>
              <div className="quick-links">
                {quickLinks.map((link) => (
                  <div
                    key={link.path}
                    className="quick-link-card"
                    onClick={() => navigate(link.path)}
                  >
                    <div className="quick-link-icon">{link.icon}</div>
                    <div className="quick-link-title">{link.title}</div>
                    <div className="quick-link-desc">{link.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh sách học sinh gần đây */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Danh sách học sinh</h2>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate("/teacher/students")}
                >
                  Xem tất cả →
                </button>
              </div>
              {recentStudents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👨‍🎓</div>
                  <div className="empty-text">
                    Chưa có học sinh nào. Thêm học sinh đầu tiên!
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/teacher/students/new")}
                  >
                    + Thêm học sinh
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Họ và tên</th>
                        <th>Lớp</th>
                        <th>Giới tính</th>
                        <th>Phụ huynh</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentStudents.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 500 }}>{s.name}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: "#eff6ff",
                                color: "#2563eb",
                              }}
                            >
                              {s.class}
                            </span>
                          </td>
                          <td>
                            {s.gender === "male"
                              ? "Nam"
                              : s.gender === "female"
                              ? "Nữ"
                              : "Khác"}
                          </td>
                          <td style={{ color: "#64748b" }}>
                            {s.parent_name || "—"}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => navigate(`/student/${s.id}`)}
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
