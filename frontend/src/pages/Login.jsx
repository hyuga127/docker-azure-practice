import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Chuyển hướng nếu đã đăng nhập
  React.useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(`/${loggedInUser.role}`, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setEmail(role === "teacher" ? "teacher@school.com" : "parent@school.com");
    setPassword("password123");
    setError("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo / Thương hiệu */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🏫</div>
          <h1 style={styles.brandName}>QuanLyHocSinh</h1>
          <p style={styles.brandSubtitle}>Hệ thống Quản lý Học sinh Tiểu học</p>
        </div>

        <h2 style={styles.title}>Đăng nhập vào tài khoản</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label htmlFor="email">Địa chỉ Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@truong.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              marginTop: "8px",
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Đang đăng nhập…
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Tài khoản demo */}
        <div style={styles.demoSection}>
          <p style={styles.demoTitle}>Tài khoản Demo</p>
          <div style={styles.demoButtons}>
            <button
              type="button"
              onClick={() => fillDemo("teacher")}
              style={styles.demoBtn}
            >
              👩‍🏫 Demo Giáo viên
            </button>
            <button
              type="button"
              onClick={() => fillDemo("parent")}
              style={styles.demoBtn}
            >
              👨‍👩‍👧 Demo Phụ huynh
            </button>
          </div>
          <p style={styles.demoNote}>
            Mật khẩu tất cả tài khoản: <code>password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
    padding: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  },
  brand: {
    textAlign: "center",
    marginBottom: "28px",
  },
  brandIcon: {
    fontSize: "2.5rem",
    marginBottom: "8px",
  },
  brandName: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px",
  },
  brandSubtitle: {
    fontSize: ".85rem",
    color: "#64748b",
    margin: 0,
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  demoSection: {
    marginTop: "28px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  demoTitle: {
    fontSize: ".8rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: ".06em",
    marginBottom: "10px",
  },
  demoButtons: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "10px",
  },
  demoBtn: {
    padding: "8px 14px",
    fontSize: ".8rem",
    fontWeight: "500",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all .15s",
    color: "#475569",
  },
  demoNote: {
    fontSize: ".75rem",
    color: "#94a3b8",
  },
};

export default Login;
