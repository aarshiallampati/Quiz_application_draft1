import { createContext, useContext, useState, useCallback } from 'react';
import quizService from '../services/quizService';

const QuizContext = createContext(null);

export const useQuiz = () => useContext(QuizContext);

export function QuizProvider({ children }) {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentAttempt, setCurrentAttempt] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await quizService.fetchQuizzes();
            setQuizzes(data.quizzes || data);
        } catch (err) {
            console.error('Failed to load quizzes', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const startQuiz = useCallback(async (quizId) => {
        setLoading(true);
        try {
            const data = await quizService.startQuiz(quizId);
            setCurrentAttempt(data);
            return data;
        } catch (err) {
            console.error('Failed to start quiz', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const submitQuiz = useCallback(async (quizId, answers) => {
        setLoading(true);
        try {
            const data = await quizService.submitQuiz(quizId, answers);
            setCurrentAttempt(null);
            return data;
        } catch (err) {
            console.error('Failed to submit quiz', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = {
        quizzes,
        currentQuiz,
        currentAttempt,
        loading,
        setCurrentQuiz,
        loadQuizzes,
        startQuiz,
        submitQuiz,
    };

    return (
        <QuizContext.Provider value={value}>
            {children}
        </QuizContext.Provider>
    );
}

export default QuizContext;
