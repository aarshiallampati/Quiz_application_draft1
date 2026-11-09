import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, Guest, Require } from './auth';
import { ConfirmProvider, ToastProvider } from './components/Ui';
import Shell from './components/Shell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';
import HostHome from './pages/admin/Home';
import People from './pages/admin/People';
import Proctor, { ProctorDetail } from './pages/admin/Proctor';
import QuizEditor from './pages/admin/QuizEditor';
import QuizInsight from './pages/admin/QuizInsight';
import Quizzes from './pages/admin/Quizzes';
import Results from './pages/admin/Results';
import History from './pages/student/History';
import StudentHome from './pages/student/Home';
import Insights from './pages/student/Insights';
import Play from './pages/student/Play';
import Result from './pages/student/Result';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Guest><Login /></Guest> },
  { path: '/register', element: <Guest><Register /></Guest> },
  { path: '/play/:quizId', element: <Require role="student"><Play /></Require> },
  {
    element: <Require><Shell /></Require>,
    children: [
      { path: '/home', element: <Require role="student"><StudentHome /></Require> },
      { path: '/home/history', element: <Require role="student"><History /></Require> },
      { path: '/home/insights', element: <Require role="student"><Insights /></Require> },
      { path: '/home/profile', element: <Require role="student"><Profile /></Require> },
      { path: '/result/:submissionId', element: <Result /> },
      { path: '/host', element: <Require role="admin"><HostHome /></Require> },
      { path: '/host/rounds', element: <Require role="admin"><Quizzes /></Require> },
      { path: '/host/rounds/:quizId', element: <Require role="admin"><QuizEditor /></Require> },
      { path: '/host/results', element: <Require role="admin"><Results /></Require> },
      { path: '/host/results/:quizId', element: <Require role="admin"><QuizInsight /></Require> },
      { path: '/host/watch', element: <Require role="admin"><Proctor /></Require> },
      { path: '/host/watch/:submissionId', element: <Require role="admin"><ProctorDetail /></Require> },
      { path: '/host/people', element: <Require role="admin"><People /></Require> },
      { path: '/host/people/:studentId', element: <Require role="admin"><Insights /></Require> },
      { path: '/host/profile', element: <Require role="admin"><Profile /></Require> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
