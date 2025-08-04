// src/components/auth/LoginForm.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

const LoginForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [alert, setAlert] = useState(null);

    const { login, loading } = useContext(AuthContext);

    const { username, password } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validate
        if (!username || !password) {
            setAlert({
                type: 'error',
                message: 'Please enter all fields'
            });
            return;
        }

        // Login
        const result = await login({ username, password });
        if (!result.success) {
            setAlert({
                type: 'error',
                message: result.error
            });
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

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
                        placeholder="Enter your username"
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
                        placeholder="Enter your password"
                        className="input"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-full flex justify-center items-center"
                    disabled={loading}
                >
                    {loading ? <LoadingSpinner size="small" /> : 'Sign In'}
                </button>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary font-medium">
                            Register
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;