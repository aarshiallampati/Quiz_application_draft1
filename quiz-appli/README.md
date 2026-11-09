# EduQuiz Pro — Frontend Architecture & Methodology

> **AI-Powered College Quiz Platform**  
> Built with React 18 + Vite | JWT Auth | Role-Based Access Control | AI Analysis | Proctoring

---

## 📁 Project Structure

```
quiz-appli/src/
├── main.jsx                      # App entry point
├── App.jsx                       # Root router & layout composition
├── index.css                     # Global styles
│
├── context/                      # Global state (React Context API)
│   ├── AuthContext.jsx           # Auth state: user, token, login/logout
│   └── QuizContext.jsx           # Quiz list state shared across pages
│
├── routes/                       # Route protection guards
│   ├── PrivateRoute.jsx          # Blocks unauthenticated users → /login
│   └── RoleRoute.jsx             # Enforces role (student / admin)
│
├── services/                     # API communication layer
│   ├── api.js                    # Axios instance (base URL + JWT header injection)
│   ├── authService.js            # Login & Register API calls
│   ├── quizService.js            # All quiz, submission & analytics API calls
│   └── proctorService.js         # Proctoring event logging & snapshot upload
│
├── components/                   # Reusable UI building blocks
│   ├── Navbar.jsx                # Top navigation bar (role-aware links)
│   ├── QuizCard.jsx              # Quiz summary card (title, subject, difficulty)
│   ├── TimerBadge.jsx            # Countdown timer for quiz session
│   ├── ProctorMonitor.jsx        # Invisible proctoring engine (tab/camera/fullscreen)
│   ├── ProctorAlert.jsx          # Floating violation notification toasts
│   ├── PerformanceChart.jsx      # Bar chart (Chart.js) for scores by topic/quiz
│   ├── RadarChart.jsx            # Radar/spider chart for subject-wise performance
│   ├── LineChart.jsx             # Line chart for score improvement trend
│   └── LoadingSpinner.jsx        # Centered loading indicator
│
└── pages/
    ├── Login.jsx                  # Sign-in form
    ├── Register.jsx               # Create account (student / admin role)
    │
    ├── student/                   # Student-facing pages
    │   ├── StudentDashboard.jsx   # Overview: stats, upcoming quizzes, charts
    │   ├── StudentQuizzes.jsx     # Browse all available quizzes
    │   ├── QuizStart.jsx          # Pre-quiz info / instructions page
    │   ├── QuizTake.jsx           # Active quiz session (timer + proctoring)
    │   ├── QuizResult.jsx         # Results: AI analysis, YouTube links, review
    │   ├── History.jsx            # Past quiz attempts listing
    │   └── StudentProfile.jsx     # View/edit profile info
    │
    └── admin/                     # Admin/Faculty-facing pages
        ├── AdminDashboard.jsx      # Sidebar layout shell (Outlet-based routing)
        ├── AdminOverview.jsx       # Dashboard home: platform stats, charts
        ├── ManageQuizzes.jsx       # List, edit, delete quizzes
        ├── CreateQuiz.jsx          # Create quiz + configure settings
        ├── QuizQuestions.jsx       # Add MCQ / TrueFalse / Descriptive questions
        ├── QuizResults.jsx         # View all student submissions for a quiz
        ├── Analytics.jsx           # Platform-wide analytics charts
        ├── Students.jsx            # View registered students
        ├── ProctorDashboard.jsx    # List of proctored quiz sessions
        └── ProctorSessionDetails.jsx # Per-session violation timeline & snapshots
```

---

## 🔄 Application Flow

### 1. Authentication Flow

```
User visits /  →  Redirected to /login
       │
       ├─ Login.jsx  →  authService.login()  →  POST /api/auth/login
       │                  ↓ JWT token + user object stored in localStorage
       │                  ↓ AuthContext.user updated
       │
       └─ Register.jsx  →  authService.register()  →  POST /api/auth/register
                           ↓ Immediate login, token stored
                           ↓ Redirect based on role:
                               student → /student/dashboard
                               admin   → /admin/dashboard
```

### 2. Route Protection (Guards)

```
All protected routes are wrapped:

<PrivateRoute>             — checks AuthContext.isAuthenticated
  <RoleRoute role="X">    — checks user.role matches required role
    <PageComponent />
```

If not authenticated → redirect to `/login`  
If wrong role → redirect to `/{correctRole}/dashboard`

### 3. Student Quiz Flow

```
StudentDashboard  →  Browse available quizzes (QuizContext)
      │
QuizStart         →  Read quiz info, click "Start"
      │                POST /api/submission/start/:quizId
      │                ↓ Backend creates Submission doc, returns submissionId
      │
QuizTake          →  Active quiz interface
      │                ├─ Timer counts down (duration from quiz config)
      │                ├─ ProctorMonitor starts:
      │                │    ├─ Detects tab switches (visibilitychange event)
      │                │    ├─ Monitors fullscreen exit
      │                │    ├─ Detects copy/paste attempts
      │                │    └─ Periodic webcam snapshots
      │                └─ On Submit:
      │                     1. proctorActive = false (stops monitoring)
      │                     2. Exits fullscreen gracefully
      │                     3. POST /api/submission/submit/:quizId
      │                          ↓ Backend grades answers
      │                          ↓ AI analysis of wrong answers
      │                          ↓ PDF report generated (async)
      │                          ↓ Email sent to student (async)
      │
QuizResult        →  GET /api/submission/:id/result
                      Renders:
                      ├─ Score card (pass/fail, %)
                      ├─ Stats (correct, wrong, unanswered, time)
                      ├─ Collapsible question review
                      ├─ AI Learning Insights (why wrong, correct explanation)
                      ├─ YouTube video recommendations per wrong topic
                      └─ Email notification banner
```

### 4. Admin Flow

```
AdminDashboard (shell with sidebar)
      │
      ├─ AdminOverview      →  Platform stats cards + charts
      ├─ ManageQuizzes      →  CRUD operations on quizzes
      ├─ CreateQuiz         →  Quiz creation wizard
      ├─ QuizQuestions      →  Add questions (MCQ / True-False / Descriptive)
      ├─ QuizResults        →  View all student submissions per quiz
      ├─ Analytics          →  Subject-wise scores + participation charts
      ├─ Students           →  Enrolled student directory
      └─ ProctorDashboard   →  Violation logs
           └─ ProctorSessionDetails  →  Per-student event timeline
```

---

## 🧩 Key Components Explained

### `ProctorMonitor.jsx`
The core proctoring engine. It is an **invisible** component mounted during quiz sessions. It:
- Listens to `document.visibilitychange` to detect tab switches
- Tracks `fullscreenchange` events for fullscreen exits
- Intercepts `copy`, `paste`, `cut` clipboard events
- Captures periodic webcam snapshots using `getUserMedia`
- Logs all violations to the backend via `proctorService.logEvent(submissionId, quizId, event)`
- Triggers `onForceSubmit` if violation count exceeds a threshold

### `ProctorAlert.jsx`
A floating toast notification that appears briefly when a violation is detected, warning the student without blocking the quiz.

### `AuthContext.jsx`
A React Context that wraps the entire app. It holds:
- `user` — the logged-in user object (`{ _id, name, email, role }`)
- `isAuthenticated` — boolean derived from `!!user`
- `loading` — whether session restoration is in progress
- `login()`, `register()`, `logout()` — mutations
- Session is persisted via `localStorage` (token + user JSON)

### `QuizContext.jsx`
Caches the available quiz list across pages so it isn't re-fetched on every navigation.

---

## 🔌 Service Layer

All backend communication is centralised in the `/services` directory. No page calls `fetch()` directly.

### `api.js`
Axios instance with:
- `baseURL` pointing to the backend (`http://localhost:5000/api`)
- Request interceptor that attaches `Authorization: Bearer <token>` from `localStorage`

### `authService.js`
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `login(email, password)` | `POST /auth/login` | Authenticate, return token + user |
| `register(userData)` | `POST /auth/register` | Register new user |

### `quizService.js`
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `fetchQuizzes()` | `GET /quiz/student/my-quizzes` | Quizzes available to student |
| `startQuiz(quizId)` | `POST /submission/start/:quizId` | Begin quiz session |
| `submitQuiz(quizId, answers)` | `POST /submission/submit/:quizId` | Submit & grade quiz |
| `getResult(submissionId)` | `GET /submission/:id/result` | Fetch graded result |
| `getHistory()` | `GET /submission/history` | Student's past attempts |
| `getStudentAnalytics(studentId)` | `GET /analytics/student/:id` | Student performance data |
| `createQuiz(quizData)` | `POST /quiz` | Admin: create quiz |
| `getAllQuizzes()` | `GET /quiz` | Admin: list all quizzes |
| `addQuestion(quizId, data)` | `POST /quiz/:id/questions` | Admin: add question |
| `getAllResults()` | `GET /submission/all` | Admin: all submissions |
| `getQuizAnalytics(quizId)` | `GET /analytics/quiz/:id` | Admin: per-quiz stats |
| `getQuestionAnalytics(quizId)` | `GET /analytics/question/:id` | Admin: per-question stats |
| `getProctorDashboard()` | `GET /proctor/dashboard` | Admin: proctoring overview |
| `getProctorSession(submissionId)` | `GET /proctor/session/:id` | Admin: session violations |

### `proctorService.js`
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `logEvent(submissionId, quizId, event)` | `POST /proctor/event` | Log a violation event |
| `uploadSnapshot(submissionId, quizId, imageBlob)` | `POST /proctor/snapshot` | Upload webcam snapshot |

---

## 🛡️ Security & Access Control Summary

| Route Pattern | Guard | Allowed Roles |
|---------------|-------|--------------|
| `/login`, `/register` | None (public) | Anyone |
| `/student/*` | PrivateRoute + RoleRoute | `student` only |
| `/admin/*` | PrivateRoute + RoleRoute | `admin` only |
| `/` and unknown paths | — | Redirect to `/login` |

---

## 🤖 AI-Powered Features

### Wrong Answer Analysis
After quiz submission, the backend (`aiService.js`) analyses each wrong answer:
- **With OpenAI key**: GPT-3.5-Turbo generates concept identification, root-cause explanation, corrected logic, study tips, and YouTube search queries
- **Without OpenAI key (fallback)**: Rule-based analysis using question metadata generates detailed multi-sentence explanations and topic-based YouTube search URLs

### YouTube Recommendations
Each wrong answer insight includes 2–3 clickable YouTube search links generated from the identified weak concept/subject. These appear as buttons on the result page and as clickable links in the PDF report.

### Automated Report & Email
After every quiz submission:
1. A PDF report is generated (score summary, question review, AI analysis, YouTube links)
2. The PDF is emailed to the student's registered email address (if SMTP is configured)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Chart.js + react-chartjs-2** | Data visualisation |
| **Bootstrap 5** | UI components & grid |
| **Bootstrap Icons** | Icon library |

---

## 🚀 Running the Frontend

```bash
cd quiz-appli
npm install
npm run dev
# Opens at http://localhost:5173
```

> Requires the backend to be running at `http://localhost:5000`

---

*EduQuiz Pro — Frontend Documentation | Generated 2026*
