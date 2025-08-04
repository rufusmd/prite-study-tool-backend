// src/pages/auth/LoginPage.jsx
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage = () => {
    const { isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 px-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">PRITE Study Tool</h1>
                <p className="mt-2 text-gray-600">A collaborative flashcard system for PRITE exam preparation</p>
            </div>

            <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow p-6">
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage;