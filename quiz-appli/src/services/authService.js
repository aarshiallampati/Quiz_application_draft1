import API from './api';

const authService = {
    login: async (email, password) => {
        const response = await API.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await API.post('/auth/register', userData);
        return response.data;
    },

    getProfile: async () => {
        const response = await API.get('/auth/me');
        return response.data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await API.put('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    },
};

export default authService;
