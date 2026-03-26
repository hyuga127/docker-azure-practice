import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🏫</span>
        <span className="brand-name">QuanLyHocSinh</span>
      </div>

      <div className="navbar-links">
        {user?.role === "teacher" && (
          <>
            <Link
              to="/teacher"
              className={`nav-link ${isActive("/teacher") ? "active" : ""}`}
            >
              Trang chủ
            </Link>
            <Link
              to="/teacher/students"
              className={`nav-link ${
                location.pathname.startsWith("/teacher/students")
                  ? "active"
                  : ""
              }`}
            >
              Học sinh
            </Link>
            <Link
              to="/teacher/attendance"
              className={`nav-link ${
                isActive("/teacher/attendance") ? "active" : ""
              }`}
            >
              Điểm danh
            </Link>
            <Link
              to="/teacher/scores"
              className={`nav-link ${
                isActive("/teacher/scores") ? "active" : ""
              }`}
            >
              Điểm số
            </Link>
          </>
        )}

        {user?.role === "parent" && (
          <Link
            to="/parent"
            className={`nav-link ${isActive("/parent") ? "active" : ""}`}
          >
            Trang chủ
          </Link>
        )}
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <span className="user-name">{user?.name}</span>
          <span className={`user-role role-${user?.role}`}>
            {user?.role === "teacher" ? "Giáo viên" : "Phụ huynh"}
          </span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Đăng xuất
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
