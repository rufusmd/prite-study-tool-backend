// src/components/auth/RegisterForm.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [alert, setAlert] = useState(null);

    const { register, loading } = useContext(AuthContext);

    const { username, email, password, confirmPassword } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validate
        if (!username || !email || !password) {
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
        const result = await register({ username, email, password });
        if (!result.success) {
            setAlert({
                type: 'error',
                message: result.error
            });
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={onChange}
                        placeholder="Choose a username"
                        className="input"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        placeholder="Enter your email"
                        className="input"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        placeholder="Choose a password"
                        className="input"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        placeholder="Confirm your password"
                        className="input"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-full flex justify-center items-center"
                    disabled={loading}
                >
                    {loading ? <LoadingSpinner size="small" /> : 'Register'}
                </button>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;