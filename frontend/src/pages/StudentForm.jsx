import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { studentService } from "../services/api";

const CLASS_OPTIONS = [
  "1A",
  "1B",
  "1C",
  "2A",
  "2B",
  "2C",
  "3A",
  "3B",
  "3C",
  "4A",
  "4B",
  "5A",
  "5B",
  "6A",
  "6B",
];

const INITIAL_FORM = {
  name: "",
  dateOfBirth: "",
  gender: "",
  class: "",
  parentId: "",
};

const StudentForm = () => {
  const { id } = useParams(); // Có giá trị khi đang chỉnh sửa
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Luôn tải danh sách phụ huynh cho dropdown
        const parentsRes = await studentService.getParents();
        setParents(parentsRes.data);

        // Nếu đang chỉnh sửa, điền sẵn thông tin học sinh
        if (isEdit) {
          const studentRes = await studentService.getById(id);
          const s = studentRes.data;
          setForm({
            name: s.name,
            dateOfBirth: s.date_of_birth ? s.date_of_birth.split("T")[0] : "",
            gender: s.gender,
            class: s.class,
            parentId: s.parent_id ?? "",
          });
        }
      } catch {
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập họ và tên.";
    if (!form.dateOfBirth) return "Vui lòng nhập ngày sinh.";
    if (!form.gender) return "Vui lòng chọn giới tính.";
    if (!form.class) return "Vui lòng chọn lớp.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        class: form.class,
        parentId: form.parentId || null,
      };

      if (isEdit) {
        await studentService.update(id, payload);
      } else {
        await studentService.create(payload);
      }

      navigate("/teacher/students");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Lưu thông tin thất bại. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <div className="loading-spinner">
            <div className="spinner" />
            Đang tải…
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
          <div>
            <h1 className="page-title">
              {isEdit ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}
            </h1>
            <p className="page-subtitle">
              {isEdit
                ? "Cập nhật thông tin học sinh"
                : "Tạo hồ sơ học sinh mới"}
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/teacher/students")}
          >
            ← Quay lại danh sách
          </button>
        </div>

        <div className="card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Họ và tên */}
              <div className="form-group full-width">
                <label htmlFor="name">Họ và tên *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn An"
                  required
                />
              </div>

              {/* Ngày sinh */}
              <div className="form-group">
                <label htmlFor="dateOfBirth">Ngày sinh *</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Giới tính */}
              <div className="form-group">
                <label htmlFor="gender">Giới tính *</label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Lớp */}
              <div className="form-group">
                <label htmlFor="class">Lớp *</label>
                <select
                  id="class"
                  name="class"
                  value={form.class}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn lớp</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phụ huynh */}
              <div className="form-group">
                <label htmlFor="parentId">
                  Phụ huynh / Người giám hộ{" "}
                  <span style={{ fontWeight: 400, textTransform: "none" }}>
                    (không bắt buộc)
                  </span>
                </label>
                <select
                  id="parentId"
                  name="parentId"
                  value={form.parentId}
                  onChange={handleChange}
                >
                  <option value="">Chưa liên kết phụ huynh</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
                {parents.length === 0 && (
                  <p
                    style={{
                      fontSize: ".75rem",
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Chưa có tài khoản phụ huynh nào trong hệ thống.
                  </p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/teacher/students")}
                disabled={saving}
              >
                Hủy
              </button>
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
                    />
                    {isEdit ? "Đang lưu…" : "Đang tạo…"}
                  </>
                ) : isEdit ? (
                  "💾 Lưu thay đổi"
                ) : (
                  "+ Tạo học sinh"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentForm;
