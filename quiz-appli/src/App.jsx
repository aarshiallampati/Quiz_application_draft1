import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';

// Route guards
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';

// Layout / shared
import Navbar from './components/Navbar';

// Pages – auth
import Login from './pages/Login';
import Register from './pages/Register';

// Pages – student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQuizzes from './pages/student/StudentQuizzes';
import QuizStart from './pages/student/QuizStart';
import QuizTake from './pages/student/QuizTake';
import QuizResult from './pages/student/QuizResult';
import History from './pages/student/History';
import StudentProfile from './pages/student/StudentProfile';

// Pages – admin (layout + children)
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import CreateQuiz from './pages/admin/CreateQuiz';
import QuizQuestions from './pages/admin/QuizQuestions';
import QuizResults from './pages/admin/QuizResults';
import ProctorDashboard from './pages/admin/ProctorDashboard';
import ProctorSessionDetails from './pages/admin/ProctorSessionDetails';
import Students from './pages/admin/Students';
import Analytics from './pages/admin/Analytics';
import AdminOverview from './pages/admin/AdminOverview';

function StudentLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="student-content">{children}</div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <QuizProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Student routes ──────────────────────────── */}
            <Route
              path="/student/*"
              element={
                <PrivateRoute>
                  <RoleRoute role="student">
                    <StudentLayout>
                      <Routes>
                        <Route path="dashboard" element={<StudentDashboard />} />
                        <Route path="quizzes" element={<StudentQuizzes />} />
                        <Route path="quiz/:quizId/start" element={<QuizStart />} />
                        <Route path="quiz/:quizId/take" element={<QuizTake />} />
                        <Route path="quiz/result/:attemptId" element={<QuizResult />} />
                        <Route path="history" element={<History />} />
                        <Route path="profile" element={<StudentProfile />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </StudentLayout>
                  </RoleRoute>
                </PrivateRoute>
              }
            />

            {/* ── Admin routes (sidebar layout via Outlet) ─ */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <RoleRoute role="admin">
                    <AdminDashboard />
                  </RoleRoute>
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminOverview />} />
              <Route path="quizzes" element={<ManageQuizzes />} />
              <Route path="quizzes/create" element={<CreateQuiz />} />
              <Route path="quizzes/:quizId/questions" element={<QuizQuestions />} />
              <Route path="quizzes/:quizId/results" element={<QuizResults />} />
              <Route path="results" element={<QuizResults />} />
              <Route path="proctor" element={<ProctorDashboard />} />
              <Route path="proctor/:submissionId" element={<ProctorSessionDetails />} />
              <Route path="students" element={<Students />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </QuizProvider>
      </AuthProvider>
    </Router>
  );
}
