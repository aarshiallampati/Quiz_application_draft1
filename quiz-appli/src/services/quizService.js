import API from './api';

const quizService = {
    // ── Student APIs ──────────────────────────────────────
    fetchQuizzes: async () => {
        const response = await API.get('/quiz/student/my-quizzes');
        return response.data;
    },

    getQuizById: async (quizId) => {
        const response = await API.get(`/quiz/${quizId}`);
        return response.data;
    },

    startQuiz: async (quizId) => {
        const response = await API.post(`/submission/start/${quizId}`);
        return response.data;
    },

    submitQuiz: async (quizId, answers) => {
        const response = await API.post(`/submission/submit/${quizId}`, { answers });
        return response.data;
    },

    getResult: async (submissionId) => {
        const response = await API.get(`/submission/${submissionId}/result`);
        return response.data;
    },

    getHistory: async () => {
        const response = await API.get('/submission/history');
        return response.data;
    },

    // ── Admin Quiz APIs ──────────────────────────────────
    createQuiz: async (quizData) => {
        const response = await API.post('/quiz', quizData);
        return response.data;
    },

    getAllQuizzes: async () => {
        const response = await API.get('/quiz');
        return response.data;
    },

    updateQuiz: async (quizId, quizData) => {
        const response = await API.put(`/quiz/${quizId}`, quizData);
        return response.data;
    },

    deleteQuiz: async (quizId) => {
        const response = await API.delete(`/quiz/${quizId}`);
        return response.data;
    },

    assignQuiz: async (quizId, assignmentData) => {
        const response = await API.post(`/quiz/${quizId}/assign`, assignmentData);
        return response.data;
    },

    // ── Admin Question APIs ──────────────────────────────
    addQuestion: async (quizId, questionData) => {
        const response = await API.post(`/quiz/${quizId}/questions`, questionData);
        return response.data;
    },

    getQuestions: async (quizId) => {
        const response = await API.get(`/quiz/${quizId}/questions`);
        return response.data;
    },

    deleteQuestion: async (questionId) => {
        const response = await API.delete(`/quiz/question/${questionId}`);
        return response.data;
    },

    // ── Admin Results / Analytics ────────────────────────
    getAllResults: async () => {
        const response = await API.get('/submission/all');
        return response.data;
    },

    getQuizResults: async (quizId) => {
        const response = await API.get(`/submission/quiz/${quizId}/results`);
        return response.data;
    },

    getQuizAnalytics: async (quizId) => {
        const response = await API.get(`/analytics/quiz/${quizId}`);
        return response.data;
    },

    getOverviewAnalytics: async (filters = {}) => {
        const response = await API.get('/analytics/overview', { params: filters });
        return response.data;
    },

    getQuestionAnalytics: async (quizId) => {
        const response = await API.get(`/analytics/question/${quizId}`);
        return response.data;
    },

    getStudentAnalytics: async (studentId) => {
        const response = await API.get(`/analytics/student/${studentId}`);
        return response.data;
    },

    // ── Admin Proctor ────────────────────────────────────
    getProctorDashboard: async () => {
        const response = await API.get('/proctor/dashboard');
        return response.data;
    },

    getProctorSession: async (submissionId) => {
        const response = await API.get(`/proctor/session/${submissionId}`);
        return response.data;
    },
};

export default quizService;
