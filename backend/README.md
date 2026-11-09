# EduQuiz Pro — Backend Architecture & API Documentation

> **Node.js + Express + MongoDB REST API**  
> JWT Authentication | Role-Based Access Control | AI Analysis | PDF Reports | Proctoring

---

## 📁 Project Structure

```
backend/
├── server.js                        # Entry point — starts HTTP server
├── app.js                           # Express app setup (middleware, routes, CORS)
├── .env                             # Environment variables (secrets, DB URL)
│
├── config/
│   └── db.js                        # MongoDB connection via Mongoose
│
├── models/                          # MongoDB schemas (data layer)
│   ├── User.js                      # Users (students & admins)
│   ├── Quiz.js                      # Quiz configuration
│   ├── Question.js                  # Individual questions for a quiz
│   ├── Submission.js                # Quiz attempt records + AI analysis
│   └── ProctorLog.js                # Violation events + webcam snapshots
│
├── routes/                          # URL routing — maps HTTP methods to controllers
│   ├── authRoutes.js                # /api/auth/*
│   ├── quizRoutes.js                # /api/quiz/*
│   ├── submissionRoutes.js          # /api/submission/*
│   ├── proctorRoutes.js             # /api/proctor/*
│   └── analyticsRoutes.js           # /api/analytics/*
│
├── controllers/                     # Business logic — handles requests & responses
│   ├── authController.js            # Register, login, profile, change password
│   ├── quizController.js            # Create/update/delete quizzes & questions
│   ├── submissionController.js      # Start quiz, submit, grade, result, history
│   ├── proctorController.js         # Log violations, upload snapshots, dashboard
│   └── analyticsController.js      # Per-quiz, per-question, per-student stats
│
├── middleware/                      # Request processing pipelines
│   ├── authMiddleware.js            # JWT verification — protects all routes
│   ├── roleMiddleware.js            # Role enforcement (student / admin)
│   └── errorMiddleware.js           # Global error handler
│
├── services/                        # Standalone business services
│   ├── aiService.js                 # AI wrong-answer analysis (OpenAI / fallback)
│   ├── pdfService.js                # PDF report generation (pdfkit)
│   └── emailService.js              # Email delivery via Nodemailer + SMTP
│
└── uploads/                         # Auto-created folder for PDF reports & snapshots
```

---

## 🗃️ Database Models (MongoDB Schemas)

### `User`
Stores all registered users (students and admins).

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Full name |
| `email` | String | Unique email address (lowercased) |
| `password` | String | Bcrypt-hashed (never returned in queries) |
| `role` | Enum | `student` or `admin` |
| `enrollmentId` | String | Optional, unique per student |
| `department` | String | e.g. CSE, ECE |
| `semester` | Number | 1–8 |

> Password auto-hashed via `pre('save')` hook. `matchPassword()` method available for login verification.

---

### `Quiz`
Stores quiz configuration set by admin.

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Quiz name |
| `subject` | String | Topic area (DSA, DBMS, etc.) |
| `duration` | Number | Time limit in minutes |
| `passingScore` | Number | Minimum % to pass (default: 40) |
| `maxAttempts` | Number | Max times a student can attempt |
| `totalMarks` | Number | Auto-calculated from questions |
| `difficulty` | Enum | `easy`, `medium`, `hard` |
| `quizMode` | Enum | `immediate` (always open) or `scheduled` |
| `scheduledStart/End` | Date | For scheduled mode window |
| `shuffleQuestions` | Boolean | Randomise question order |
| `shuffleOptions` | Boolean | Randomise option order |
| `isPublished` | Boolean | Only published quizzes visible to students |
| `assignedTo` | [User refs] | Specific students assigned |
| `assignedGroups` | [{dept, sem}] | Department + semester group assignment |

---

### `Question`
Individual questions belonging to a quiz.

| Field | Type | Description |
|-------|------|-------------|
| `quiz` | Quiz ref | Parent quiz |
| `text` | String | Question statement |
| `type` | Enum | `MCQ`, `MSQ`, `TrueFalse`, `ShortAnswer`, `FillBlank` |
| `options` | [{text, isCorrect}] | Answer choices with correct flag |
| `explanation` | String | Correct answer explanation |
| `concept` | String | Topic/concept being tested |
| `subject` | String | Subject tag |
| `marks` | Number | Points for this question |

---

### `Submission`
Records a student's quiz attempt end-to-end.

| Field | Type | Description |
|-------|------|-------------|
| `student` | User ref | Who attempted |
| `quiz` | Quiz ref | Which quiz |
| `answers` | Array | Each: `{question, selectedOptions, isCorrect, marksAwarded, timeTaken}` |
| `score` | Number | Total marks earned |
| `totalMarks` | Number | Max possible marks |
| `percentage` | Number | Score % |
| `passed` | Boolean | Whether passing threshold was met |
| `timeTaken` | Number | Total seconds spent |
| `status` | Enum | `in-progress` → `submitted` → `graded` |
| `aiAnalysis` | Array | Per-wrong-answer: `{concept, whyWrong, correctExplanation, studyTip, youtubeLinks}` |
| `reportUrl` | String | File path to generated PDF |

---

### `ProctorLog`
Proctoring events and snapshots for a student's quiz session.

| Field | Type | Description |
|-------|------|-------------|
| `student` | User ref | Student being proctored |
| `quiz` | Quiz ref | Quiz being taken |
| `submission` | Submission ref | Linked attempt |
| `events` | Array | Each: `{type, timestamp, severity, details}` |
| `snapshots` | Array | Webcam captures `{image URL, timestamp}` |
| `severityScore` | Number | Computed risk score |
| `recommendation` | Enum | `none`, `review`, `flag`, `disqualify` |

> **Event types tracked:** `tab_switch`, `fullscreen_exit`, `window_blur`, `copy_paste_attempt`, `face_not_detected`, `multiple_faces`

---

## 🌐 API Endpoints Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | ❌ | Any | Create account |
| POST | `/login` | ❌ | Any | Sign in, returns JWT token |
| GET | `/me` | ✅ | Any | Get logged-in user's profile |
| PUT | `/change-password` | ✅ | Any | Update password |
| GET | `/students` | ✅ | Admin | List all registered students |

---

### Quizzes — `/api/quiz`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/student/my-quizzes` | ✅ | Student | Published quizzes assigned to this student |
| POST | `/` | ✅ | Admin | Create a new quiz |
| GET | `/` | ✅ | Admin | List all quizzes |
| GET | `/:id` | ✅ | Any | Get quiz details |
| PUT | `/:id` | ✅ | Admin | Update quiz settings |
| DELETE | `/:id` | ✅ | Admin | Delete quiz (and its questions) |
| POST | `/:id/assign` | ✅ | Admin | Assign quiz to students/groups |
| POST | `/:id/questions` | ✅ | Admin | Add a question to a quiz |
| GET | `/:id/questions` | ✅ | Any | Fetch all questions for a quiz |
| DELETE | `/question/:questionId` | ✅ | Admin | Delete a question |

---

### Submissions — `/api/submission`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/start/:quizId` | ✅ | Student | Start quiz session (creates Submission doc) |
| POST | `/submit/:quizId` | ✅ | Student | Submit answers, triggers grading pipeline |
| GET | `/history` | ✅ | Student | Student's past submissions |
| GET | `/latest/result` | ✅ | Student | Most recent result |
| GET | `/:submissionId/result` | ✅ | Any | Full submission details + AI analysis |
| GET | `/quiz/:quizId/results` | ✅ | Admin | All submissions for a quiz |
| GET | `/all` | ✅ | Admin | All submissions across all quizzes |

---

### Proctoring — `/api/proctor`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/log-event` | ✅ | Student | Log a violation event during quiz |
| POST | `/snapshot` | ✅ | Student | Upload webcam snapshot |
| GET | `/session/:submissionId` | ✅ | Any | Full proctoring log for a session |
| GET | `/dashboard` | ✅ | Admin | Overview of all proctored sessions |

---

### Analytics — `/api/analytics`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/quiz/:quizId` | ✅ | Admin | Stats for a specific quiz (avg, pass rate, high/low) |
| GET | `/question/:quizId` | ✅ | Admin | Per-question accuracy + most common wrong answer |
| GET | `/student/:studentId` | ✅ | Any | Student's score history, trend, weak subjects |

---

## ⚙️ Middleware Explained

### `authMiddleware.js` — JWT Verification
- Extracts the `Authorization: Bearer <token>` header
- Verifies the token using `jsonwebtoken` and `JWT_SECRET`
- Attaches the decoded user object (`req.user`) to every protected request
- Returns `401 Unauthorized` if token is missing, expired, or invalid

### `roleMiddleware.js` — Role Enforcement
- Called after `authMiddleware`
- Checks `req.user.role` matches the required role
- Returns `403 Forbidden` if role doesn't match

### `errorMiddleware.js` — Global Error Handler
- Catches all uncaught errors passed via `next(error)`
- Returns structured JSON error responses with proper HTTP status codes
- Prevents raw stack traces from leaking to the client

---

## 🧠 Services Explained

### `aiService.js` — Wrong Answer Analysis
Two modes:

**With `OPENAI_API_KEY` in `.env`:**
- Sends wrong answers to GPT-3.5-Turbo
- Prompt asks for: concept name, why wrong, correct explanation, study tip, youtube search terms
- Returns structured JSON per wrong answer

**Without API key (Fallback mode):**
- Pure rule-based analysis using question metadata (`subject`, `explanation` fields)
- Generates multi-sentence explanations from templates
- Still produces YouTube search URLs using the subject/concept as the query

### `pdfService.js` — PDF Report Generation
Uses `pdfkit` to generate a structured PDF containing:
- Student info and quiz title
- Score summary (marks, %, pass/fail)
- Question-by-question review (student answer vs correct answer)
- AI analysis per wrong answer (concept, explanation, study tip)
- Clickable YouTube video links
- Saved to `uploads/reports/` directory

### `emailService.js` — Email Delivery
Uses `Nodemailer` with SMTP configuration from `.env`:
- Sends rich HTML email to the student's registered email
- Email contains: score card, full AI analysis table, YouTube links
- Attaches the generated PDF as an email attachment
- Configured for Gmail with App Password support

---

## 🔄 Core Server Flow

### 1. Server Startup
```
server.js
  → app.js (Express setup: CORS, JSON parser, routes)
  → config/db.js (Mongoose connects to MongoDB at MONGO_URI)
  → Listens on PORT (default: 5000)
```

### 2. Request Lifecycle
```
HTTP Request
  → CORS check
  → JSON body parsing
  → Route matched (e.g. POST /api/submission/submit/:quizId)
  → authMiddleware (verify JWT → attach req.user)
  → roleMiddleware (check req.user.role)
  → Controller function (business logic)
  → Mongoose (read/write MongoDB)
  → JSON response sent
  → If error → errorMiddleware → structured error response
```

### 3. Quiz Submission Pipeline (most complex flow)
```
POST /api/submission/submit/:quizId
  │
  ├─ 1. Validate submission (already submitted? time expired?)
  ├─ 2. Grade each answer:
  │      For each student answer → find matching Question
  │      Compare selectedOptions against options[].isCorrect
  │      Award marks proportionally
  ├─ 3. Calculate totals: score, percentage, passed
  ├─ 4. Save Submission (status: 'submitted')
  ├─ 5. Send immediate response to frontend ← (student sees result)
  │
  └─ 6. setImmediate (background, async, non-blocking):
         ├─ Collect wrong answers
         ├─ aiService.analyzeWrongAnswers() → AI insights
         ├─ Save aiAnalysis to Submission document
         ├─ pdfService.generateResultPDF() → PDF file
         ├─ Save reportUrl to Submission
         └─ emailService.sendEmail() → send to student's email
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt (10 salt rounds) before DB save |
| **JWT Tokens** | Signed with `JWT_SECRET`, 7-day expiry |
| **Route Protection** | Every non-public route requires valid JWT |
| **Role Enforcement** | Admin-only routes reject students with 403 |
| **Password Hidden** | `select: false` on password field in User schema |
| **CORS** | Restricted to `CLIENT_URL` (defaults to localhost:5173) |
| **Input Validation** | Mongoose schema validation on all models |

---

## ✅ Functionality Status

| Feature | Status | Notes |
|---------|--------|-------|
| User registration & login | ✅ Working | JWT-based, roles enforced |
| Admin: create/edit/delete quizzes | ✅ Working | Full CRUD |
| Admin: add/delete questions (MCQ, TrueFalse, etc.) | ✅ Working | 5 question types |
| Admin: assign quiz to students/departments | ✅ Working | By user or dept+semester group |
| Student: browse assigned quizzes | ✅ Working | Filtered by assignment |
| Student: start quiz session | ✅ Working | Submission doc created |
| Student: submit quiz + auto-grading | ✅ Working | Per-answer graded instantly |
| Answer explanation in result | ✅ Working | From Question.explanation field |
| AI wrong answer analysis | ✅ Working | OpenAI if key present, fallback always runs |
| YouTube study links | ✅ Working | Generated per weak concept |
| PDF report generation | ✅ Working | Saved to uploads/reports/ |
| Email report delivery | ⚠️ Needs SMTP config | Works once SMTP creds added to .env |
| Proctoring: tab switch, copy/paste, fullscreen exit | ✅ Working | Logged to ProctorLog |
| Proctoring: webcam snapshot upload | ✅ Working | Saved in uploads/ |
| Admin: proctoring dashboard | ✅ Working | All flagged sessions visible |
| Analytics: per-quiz stats | ✅ Working | Avg, pass rate, high/low score |
| Analytics: per-question accuracy | ✅ Working | Most common wrong answer tracked |
| Analytics: per-student performance | ✅ Working | History, trend, weak subjects |
| Dashboard charts (Admin + Student) | ⚠️ Partially | Uses real quiz list, charts need wiring |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.x | HTTP framework |
| **MongoDB** | Local | NoSQL database |
| **Mongoose** | 7.x | MongoDB ODM (schema + validation) |
| **jsonwebtoken** | — | JWT creation & verification |
| **bcrypt** | — | Password hashing |
| **pdfkit** | — | PDF report generation |
| **Nodemailer** | — | Email sending via SMTP |
| **openai** | — | AI analysis (optional, fallback exists) |
| **multer** | — | Webcam snapshot file uploads |
| **cors** | — | Cross-origin request handling |
| **dotenv** | — | Environment variable loading |

---

## 🚀 Running the Backend

```bash
cd backend
npm install
# Configure .env (see .env.example)
npm run dev       # Development with nodemon
# Runs on http://localhost:5000
```

### Required `.env` Variables
```
MONGO_URI=mongodb://localhost:27017/eduquiz
JWT_SECRET=your_jwt_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=sk-...         # Optional — AI analysis
SMTP_HOST=smtp.gmail.com      # Optional — for email reports
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

---

*EduQuiz Pro — Backend Documentation | Generated 2026*
