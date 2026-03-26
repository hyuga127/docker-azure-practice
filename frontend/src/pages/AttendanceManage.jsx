import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { studentService, attendanceService } from "../services/api";

const STATUS_OPTIONS = [
  { value: "present", label: "Có mặt", icon: "✅" },
  { value: "absent", label: "Vắng mặt", icon: "❌" },
  { value: "late", label: "Đi muộn", icon: "⏰" },
];

const AttendanceManage = () => {
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: status }
  const [noteMap, setNoteMap] = useState({}); // { studentId: note }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Tất cả lớp học duy nhất
  const classes = [...new Set(students.map((s) => s.class))].sort();

  // Học sinh hiển thị theo bộ lọc lớp
  const displayedStudents = classFilter
    ? students.filter((s) => s.class === classFilter)
    : students;

  // Tải danh sách học sinh một lần khi mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentService.getAll();
        setStudents(res.data);
        // Mặc định trạng thái = 'present' cho tất cả
        const defaults = {};
        res.data.forEach((s) => {
          defaults[s.id] = "present";
        });
        setAttendanceMap(defaults);
      } catch {
        setError("Không thể tải danh sách học sinh.");
      }
    };
    fetchStudents();
  }, []);

  // Tải dữ liệu điểm danh đã có khi ngày hoặc lớp thay đổi
  const loadExistingAttendance = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setMessage("");
    try {
      const params = { date };
      if (classFilter) params.class = classFilter;

      const res = await attendanceService.getByClass(params);
      const existing = res.data;

      const statusMap = {};
      const notesMap = {};
      existing.forEach((a) => {
        statusMap[a.student_id] = a.status;
        notesMap[a.student_id] = a.note || "";
      });

      // Gộp với mặc định: giữ trạng thái đã có, học sinh chưa điểm danh = 'present'
      setAttendanceMap((prev) => {
        const merged = { ...prev };
        students.forEach((s) => {
          merged[s.id] = statusMap[s.id] ?? "present";
        });
        return merged;
      });
      setNoteMap(notesMap);
    } catch {
      setError("Không thể tải dữ liệu điểm danh cho ngày này.");
    } finally {
      setLoading(false);
    }
  }, [date, classFilter, students]);

  useEffect(() => {
    if (students.length > 0) loadExistingAttendance();
  }, [loadExistingAttendance, students]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNoteChange = (studentId, note) => {
    setNoteMap((prev) => ({ ...prev, [studentId]: note }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const records = displayedStudents.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id] || "present",
        note: noteMap[s.id] || null,
      }));

      await attendanceService.recordBulk({ date, records });
      setMessage(
        `✅ Đã lưu điểm danh cho ${records.length} học sinh ngày ${formatDate(
          date
        )}.`
      );
    } catch {
      setError("Lưu điểm danh thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const newMap = { ...attendanceMap };
    displayedStudents.forEach((s) => {
      newMap[s.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const statusCount = (status) =>
    displayedStudents.filter((s) => attendanceMap[s.id] === status).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Điểm danh</h1>
            <p className="page-subtitle">
              Điểm danh và quản lý chuyên cần hàng ngày
            </p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {/* Thanh điều khiển */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto 1fr auto",
              gap: 16,
              alignItems: "end",
              flexWrap: "wrap",
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label>Ngày điểm danh</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                style={{ width: "auto" }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Lọc theo lớp</label>
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
            </div>

            {/* Tóm tắt trạng thái */}
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-present">
                ✅ Có mặt: {statusCount("present")}
              </span>
              <span className="badge badge-absent">
                ❌ Vắng: {statusCount("absent")}
              </span>
              <span className="badge badge-late">
                ⏰ Muộn: {statusCount("late")}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => markAll("present")}
              >
                Tất cả có mặt
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => markAll("absent")}
              >
                Tất cả vắng
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            Đang tải dữ liệu điểm danh…
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">
                Không tìm thấy học sinh trong lớp đã chọn.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="attendance-grid">
              {displayedStudents.map((student) => {
                const currentStatus = attendanceMap[student.id] || "present";
                return (
                  <div key={student.id} className="attendance-row">
                    <div>
                      <div className="attendance-student-name">
                        {student.name}
                      </div>
                      <div className="attendance-student-class">
                        Lớp {student.class} ·{" "}
                        {student.gender === "male"
                          ? "Nam"
                          : student.gender === "female"
                          ? "Nữ"
                          : "Khác"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Nút chọn trạng thái */}
                      <div className="radio-group">
                        {STATUS_OPTIONS.map(({ value, label, icon }) => (
                          <label
                            key={value}
                            className={`radio-label ${value} ${
                              currentStatus === value ? `${value}-selected` : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`status-${student.id}`}
                              value={value}
                              checked={currentStatus === value}
                              onChange={() =>
                                handleStatusChange(student.id, value)
                              }
                            />
                            {icon} {label}
                          </label>
                        ))}
                      </div>

                      {/* Ghi chú */}
                      <input
                        type="text"
                        placeholder="Ghi chú (không bắt buộc)"
                        value={noteMap[student.id] || ""}
                        onChange={(e) =>
                          handleNoteChange(student.id, e.target.value)
                        }
                        style={{
                          width: 200,
                          padding: "6px 10px",
                          fontSize: ".8rem",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
                gap: 12,
              }}
            >
              <button
                className="btn btn-primary"
                onClick={handleSaveAll}
                disabled={saving}
                style={{ minWidth: 200 }}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner"
                      style={{ width: 14, height: 14 }}
                    />
                    Đang lưu…
                  </>
                ) : (
                  `💾 Lưu điểm danh (${displayedStudents.length} học sinh)`
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AttendanceManage;
