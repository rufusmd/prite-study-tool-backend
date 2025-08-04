// src/pages/auth/RegisterPage.jsx
import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        pgyLevel: '' // Added PGY level field
    });
    const [alert, setAlert] = useState(null);

    const { register, isAuthenticated, error, clearError } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Set error alert if authentication error occurs
    useEffect(() => {
        if (error) {
            setAlert({
                type: 'error',
                message: error
            });
            clearError();
        }
    }, [error, clearError]);

    const { username, email, password, confirmPassword, pgyLevel } = formData;

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async e => {
        e.preventDefault();

        // Validate
        if (!username || !email || !password || !pgyLevel) {
            setAlert({
                type: 'error',
                message: 'Please enter all required fields'
            });
            return;
        }

        if (password !== confirmPassword) {
            setAlert({
                type: 'error',
                message: 'Passwords do not match'
            });
            return;
        }

        // Register
        const result = await register({ username, email, password, pgyLevel });
        if (!result.success) {
            setAlert({
                type: 'error',
                message: result.error
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">PRITE Study Tool</h1>
                    <p className="mt-2 text-gray-600">A collaborative flashcard system for PRITE exam preparation</p>
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h2>
                </div>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={onChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={onChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="pgyLevel" className="sr-only">PGY Level</label>
                            <select
                                id="pgyLevel"
                                name="pgyLevel"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                value={pgyLevel}
                                onChange={onChange}
                            >
                                <option value="" disabled>Select PGY Level</option>
                                <option value="1">PGY-1</option>
                                <option value="2">PGY-2</option>
                                <option value="3">PGY-3</option>
                                <option value="4">PGY-4</option>
                                <option value="5">PGY-5</option>
                                <option value="6+">PGY-6+</option>
                                <option value="Fellow">Fellow</option>
                                <option value="Attending">Attending</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={onChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Register
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;