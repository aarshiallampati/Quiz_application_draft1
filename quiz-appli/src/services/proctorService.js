import API from './api';

const proctorService = {
    /**
     * Log a proctoring event (tab switch, fullscreen exit, blur, copy/paste)
     */
    logEvent: async (submissionId, quizId, event) => {
        const response = await API.post('/proctor/log-event', {
            submissionId,
            quizId,
            ...event,
        });
        return response.data;
    },

    /**
     * Upload a webcam snapshot captured during quiz (base64)
     */
    uploadSnapshot: async (submissionId, quizId, image) => {
        const response = await API.post('/proctor/snapshot', {
            submissionId,
            quizId,
            image,
        });
        return response.data;
    },

    /**
     * Upload a webcam snapshot as a file via FormData (multer)
     */
    uploadSnapshotFile: async (submissionId, quizId, file) => {
        const formData = new FormData();
        formData.append('snapshot', file);
        formData.append('submissionId', submissionId);
        formData.append('quizId', quizId);
        const response = await API.post('/proctor/snapshot', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Get proctoring session logs for a submission
     */
    getSession: async (submissionId) => {
        const response = await API.get(`/proctor/session/${submissionId}`);
        return response.data;
    },
};

export default proctorService;
