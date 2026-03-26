import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { studentService, scoreService } from "../services/api";

const SUBJECTS = [
  "Toán",
  "Tiếng Việt",
  "Tiếng Anh",
  "Khoa học",
  "Lịch sử",
  "Địa lý",
  "Âm nhạc",
  "Mỹ thuật",
  "Thể dục",
];
const TERMS = ["Học kỳ 1", "Học kỳ 2", "Học kỳ 3"];

const ScoreManage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [scores, setScores] = useState([]);
  const [termFilter, setTermFilter] = useState("");
  const [loadingScores, setLoadingScores] = useState(false);

  // Trạng thái form thêm / chỉnh sửa
  const [form, setForm] = useState({
    subject: "",
    score: "",
    term: "Học kỳ 1",
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Tải danh sách học sinh khi mount
  useEffect(() => {
    studentService
      .getAll()
      .then((res) => setStudents(res.data))
      .catch(() => {});
  }, []);

  // Tải điểm khi chọn học sinh hoặc đổi học kỳ
  useEffect(() => {
    if (!selectedStudent) {
      setScores([]);
      return;
    }
    const fetchScores = async () => {
      setLoadingScores(true);
      try {
        const params = termFilter ? { term: termFilter } : {};
        const res = await scoreService.getByStudent(selectedStudent, params);
        setScores(res.data);
      } catch {
        setError("Không thể tải điểm số.");
      } finally {
        setLoadingScores(false);
      }
    };
    fetchScores();
  }, [selectedStudent, termFilter]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const scoreVal = parseFloat(form.score);
    if (!form.subject) {
      setError("Vui lòng chọn môn học.");
      return;
    }
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 10) {
      setError("Điểm số phải là số trong khoảng từ 0 đến 10.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await scoreService.update(editingId, {
          subject: form.subject,
          score: scoreVal,
          term: form.term,
        });
        setMessage("Cập nhật điểm thành công.");
      } else {
        await scoreService.add({
          studentId: parseInt(selectedStudent),
          subject: form.subject,
          score: scoreVal,
          term: form.term,
        });
        setMessage("Thêm điểm thành công.");
      }

      // Tải lại điểm
      const params = termFilter ? { term: termFilter } : {};
      const res = await scoreService.getByStudent(selectedStudent, params);
      setScores(res.data);

      // Reset form
      setForm({ subject: "", score: "", term: "Học kỳ 1" });
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Lưu điểm thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (score) => {
    setEditingId(score.id);
    setForm({
      subject: score.subject,
      score: String(score.score),
      term: score.term,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa điểm này không?")) return;
    try {
      await scoreService.delete(id);
      setScores((prev) => prev.filter((s) => s.id !== id));
      setMessage("Đã xóa điểm.");
    } catch {
      setError("Xóa điểm thất bại.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ subject: "", score: "", term: "Học kỳ 1" });
    setError("");
  };

  const getScoreColor = (score) => {
    const n = parseFloat(score);
    if (n >= 8) return "var(--success)";
    if (n >= 6) return "var(--warning)";
    return "var(--danger)";
  };

  const getGrade = (score) => {
    const n = parseFloat(score);
    if (n >= 9) return "Xuất sắc";
    if (n >= 8) return "Giỏi";
    if (n >= 7) return "Khá";
    if (n >= 5) return "Trung bình";
    return "Yếu";
  };

  const selectedStudentData = students.find(
    (s) => s.id === parseInt(selectedStudent)
  );

  // Nhóm điểm theo học kỳ
  const scoresByTerm = scores.reduce((acc, s) => {
    if (!acc[s.term]) acc[s.term] = [];
    acc[s.term].push(s);
    return acc;
  }, {});

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Quản lý điểm số</h1>
            <p className="page-subtitle">
              Nhập và quản lý điểm số của học sinh
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* ── Cột trái: Chọn học sinh + Form nhập điểm ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chọn học sinh */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: 12 }}>
                <h2 className="card-title">Chọn học sinh</h2>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Học sinh</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    setEditingId(null);
                    setForm({ subject: "", score: "", term: "Học kỳ 1" });
                    setMessage("");
                    setError("");
                  }}
                >
                  <option value="">— Chọn học sinh —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Lớp {s.class})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentData && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 14px",
                    background: "var(--primary-light)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--primary)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: ".95rem",
                    }}
                  >
                    {selectedStudentData.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                      {selectedStudentData.name}
                    </div>
                    <div
                      style={{ fontSize: ".75rem", color: "var(--primary)" }}
                    >
                      Lớp {selectedStudentData.class} ·{" "}
                      {selectedStudentData.gender === "male"
                        ? "Nam"
                        : selectedStudentData.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ marginLeft: "auto" }}
                    onClick={() =>
                      navigate(`/student/${selectedStudentData.id}`)
                    }
                  >
                    Hồ sơ →
                  </button>
                </div>
              )}
            </div>

            {/* Form thêm / chỉnh sửa điểm */}
            {selectedStudent && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    {editingId ? "✏️ Chỉnh sửa điểm" : "+ Thêm điểm"}
                  </h2>
                  {editingId && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Hủy
                    </button>
                  )}
                </div>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div className="form-group">
                      <label>Môn học *</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Chọn môn học</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Học kỳ *</label>
                      <select
                        name="term"
                        value={form.term}
                        onChange={handleFormChange}
                      >
                        {TERMS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Điểm số * (0 – 10)</label>
                      <input
                        type="number"
                        name="score"
                        value={form.score}
                        onChange={handleFormChange}
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="VD: 8.5"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner"
                            style={{ width: 14, height: 14 }}
                          />{" "}
                          Đang lưu…
                        </>
                      ) : editingId ? (
                        "💾 Cập nhật điểm"
                      ) : (
                        "+ Thêm điểm"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ── Cột phải: Bảng điểm ── */}
          <div>
            {!selectedStudent ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <div className="empty-text">
                    Chọn học sinh để xem và quản lý điểm số.
                  </div>
                </div>
              </div>
            ) : loadingScores ? (
              <div className="loading-spinner">
                <div className="spinner" />
                Đang tải điểm số…
              </div>
            ) : (
              <div>
                {/* Bộ lọc học kỳ */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".85rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    Lọc theo học kỳ:
                  </span>
                  {["", ...TERMS].map((t) => (
                    <button
                      key={t}
                      className={`btn btn-sm ${
                        termFilter === t ? "btn-primary" : "btn-secondary"
                      }`}
                      onClick={() => setTermFilter(t)}
                    >
                      {t || "Tất cả"}
                    </button>
                  ))}
                </div>

                {scores.length === 0 ? (
                  <div className="card">
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <div className="empty-text">
                        Chưa có điểm nào
                        {termFilter ? ` trong ${termFilter}` : ""}.
                      </div>
                    </div>
                  </div>
                ) : (
                  Object.entries(scoresByTerm).map(([term, termScores]) => {
                    const avg = (
                      termScores.reduce((s, r) => s + parseFloat(r.score), 0) /
                      termScores.length
                    ).toFixed(1);
                    return (
                      <div
                        key={term}
                        className="card"
                        style={{ marginBottom: 16 }}
                      >
                        <div className="card-header">
                          <h3 className="card-title">{term}</h3>
                          <span
                            style={{
                              fontSize: ".85rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Điểm TB:{" "}
                            <strong style={{ color: getScoreColor(avg) }}>
                              {avg} / 10
                            </strong>
                          </span>
                        </div>
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Môn học</th>
                                <th>Điểm</th>
                                <th>Xếp loại</th>
                                <th>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {termScores.map((s) => {
                                const n = parseFloat(s.score);
                                return (
                                  <tr key={s.id}>
                                    <td style={{ fontWeight: 500 }}>
                                      {s.subject}
                                    </td>
                                    <td>
                                      <span
                                        className="score-cell"
                                        style={{
                                          color: getScoreColor(s.score),
                                        }}
                                      >
                                        {parseFloat(s.score).toFixed(1)}
                                      </span>
                                      <span
                                        style={{
                                          color: "var(--text-muted)",
                                          fontSize: ".8rem",
                                        }}
                                      >
                                        {" "}
                                        / 10
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className="badge"
                                        style={{
                                          background:
                                            n >= 8
                                              ? "var(--success-light)"
                                              : n >= 5
                                              ? "var(--warning-light)"
                                              : "var(--danger-light)",
                                          color: getScoreColor(s.score),
                                        }}
                                      >
                                        {getGrade(s.score)}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="table-actions">
                                        <button
                                          className="btn-icon"
                                          title="Chỉnh sửa"
                                          onClick={() => handleEdit(s)}
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          className="btn-icon danger"
                                          title="Xóa"
                                          onClick={() => handleDelete(s.id)}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScoreManage;
