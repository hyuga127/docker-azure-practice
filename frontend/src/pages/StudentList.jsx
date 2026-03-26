import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { studentService } from "../services/api";

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  // Lọc lại mỗi khi từ khóa hoặc bộ lọc thay đổi
  useEffect(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.class.toLowerCase().includes(q) ||
          (s.parent_name && s.parent_name.toLowerCase().includes(q))
      );
    }

    if (classFilter) result = result.filter((s) => s.class === classFilter);
    if (genderFilter) result = result.filter((s) => s.gender === genderFilter);

    setFiltered(result);
  }, [students, search, classFilter, genderFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAll();
      setStudents(res.data);
    } catch {
      setError("Không thể tải danh sách học sinh.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa học sinh này? Hành động này không thể hoàn tác."
      )
    )
      return;
    try {
      await studentService.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Xóa học sinh thất bại.");
    }
  };

  // Danh sách lớp duy nhất cho bộ lọc
  const classes = [...new Set(students.map((s) => s.class))].sort();

  const calcAge = (dob) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const formatGender = (gender) => {
    if (gender === "male") return "Nam";
    if (gender === "female") return "Nữ";
    return "Khác";
  };

  const genderIcon = (gender) =>
    gender === "male" ? "👦" : gender === "female" ? "👧" : "🧒";

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Học sinh</h1>
            <p className="page-subtitle">Quản lý hồ sơ tất cả học sinh</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/teacher/students/new")}
          >
            + Thêm học sinh
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Bộ lọc */}
        <div className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm theo tên, lớp hoặc phụ huynh…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Lớp {c}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
          <span
            style={{
              marginLeft: "auto",
              fontSize: ".85rem",
              color: "var(--text-secondary)",
            }}
          >
            {filtered.length} học sinh
          </span>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            Đang tải danh sách học sinh…
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">👨‍🎓</div>
              <div className="empty-text">
                {students.length === 0
                  ? "Chưa có học sinh nào. Thêm học sinh đầu tiên!"
                  : "Không tìm thấy học sinh phù hợp với bộ lọc."}
              </div>
              {students.length === 0 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/teacher/students/new")}
                >
                  + Thêm học sinh
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Họ và tên</th>
                  <th>Lớp</th>
                  <th>Tuổi</th>
                  <th>Giới tính</th>
                  <th>Ngày sinh</th>
                  <th>Phụ huynh</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr key={student.id}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background:
                              student.gender === "female"
                                ? "#fce7f3"
                                : "#dbeafe",
                            color:
                              student.gender === "female"
                                ? "#be185d"
                                : "#1d4ed8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: ".85rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {student.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: "#eff6ff", color: "#2563eb" }}
                      >
                        {student.class}
                      </span>
                    </td>
                    <td>{calcAge(student.date_of_birth)} tuổi</td>
                    <td>
                      {genderIcon(student.gender)}{" "}
                      {formatGender(student.gender)}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {new Date(student.date_of_birth).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {student.parent_name || (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon"
                          title="Xem hồ sơ"
                          onClick={() => navigate(`/student/${student.id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="btn-icon"
                          title="Chỉnh sửa"
                          onClick={() =>
                            navigate(`/teacher/students/${student.id}/edit`)
                          }
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Xóa học sinh"
                          onClick={() => handleDelete(student.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentList;
