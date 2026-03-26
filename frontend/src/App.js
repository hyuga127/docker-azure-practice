import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import StudentList from "./pages/StudentList";
import StudentForm from "./pages/StudentForm";
import StudentProfile from "./pages/StudentProfile";
import AttendanceManage from "./pages/AttendanceManage";
import ScoreManage from "./pages/ScoreManage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute role="teacher">
                <StudentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students/new"
            element={
              <ProtectedRoute role="teacher">
                <StudentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students/:id/edit"
            element={
              <ProtectedRoute role="teacher">
                <StudentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute role="teacher">
                <AttendanceManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/scores"
            element={
              <ProtectedRoute role="teacher">
                <ScoreManage />
              </ProtectedRoute>
            }
          />

          {/* Shared student profile route */}
          <Route
            path="/student/:id"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Parent routes */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute role="parent">
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
