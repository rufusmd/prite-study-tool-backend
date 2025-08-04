// src/pages/SettingsPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PriteScoreHistory from '../components/stats/PriteScoreHistory';
import api from '../utils/api';

const SettingsPage = () => {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const { clearLocalData } = useContext(QuestionContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        pgyLevel: '',
        specialty: '',
        institution: '',
        displayName: ''
    });

    const [settings, setSettings] = useState({
        shareUsageData: false,
        publicProfile: false
    });

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const navigate = useNavigate();

    // Load user profile and settings
    useEffect(() => {
        if (user) {
            setProfile({
                username: user.username || '',
                email: user.email || '',
                pgyLevel: user.pgyLevel || '',
                specialty: user.specialty || '',
                institution: user.institution || '',
                displayName: user.displayName || ''
            });

            // Load settings
            setSettings({
                shareUsageData: user.settings?.shareUsageData || false,
                publicProfile: user.settings?.publicProfile || false
            });
        }
    }, [user]);

    // Handle profile update
    const handleProfileUpdate = async () => {
        try {
            setLoading(true);

            // Make an API call to update the user profile
            const response = await api.put('/users/profile', profile);

            if (response.data && response.data.success) {
                setAlert({
                    type: 'success',
                    message: 'Profile updated successfully'
                });

                // Update the user context
                if (updateUserProfile) {
                    updateUserProfile(response.data.user);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle toggle switch changes
    const handleToggle = async (setting) => {
        try {
            setLoading(true);

            // Update the setting state
            const newSettings = {
                ...settings,
                [setting]: !settings[setting]
            };

            setSettings(newSettings);

            // Make an API call to update the user settings
            const response = await api.put('/users/settings', {
                settings: newSettings
            });

            if (response.data && response.data.success) {
                setAlert({
                    type: 'success',
                    message: 'Settings updated successfully'
                });

                // Update the user context
                if (updateUserProfile && response.data.user) {
                    updateUserProfile(response.data.user);
                }
            } else {
                // Revert the state if API call fails
                setSettings(settings);
                throw new Error(response.data?.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Settings update error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to update settings'
            });
            // Revert the state if API call fails
            setSettings(settings);
        } finally {
            setLoading(false);
        }
    };

    // Handle export study data
    const handleExportStudyData = async () => {
        try {
            setLoading(true);
            setAlert({
                type: 'info',
                message: 'Preparing your study data for export...'
            });

            const response = await api.get('/users/export/study-data');

            if (response.data && response.data.success) {
                // Create a downloadable blob
                const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                // Create a link and trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = `prite_study_data_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setAlert({
                    type: 'success',
                    message: 'Study data exported successfully'
                });
            } else {
                throw new Error(response.data?.message || 'Failed to export study data');
            }
        } catch (error) {
            console.error('Export error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to export study data'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle export my questions
    const handleExportQuestions = async () => {
        try {
            setLoading(true);
            setAlert({
                type: 'info',
                message: 'Preparing your questions for export...'
            });

            const response = await api.get('/users/export/questions');

            if (response.data && response.data.success) {
                // Create a downloadable blob
                const blob = new Blob([JSON.stringify(response.data.questions, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                // Create a link and trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = `prite_questions_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setAlert({
                    type: 'success',
                    message: 'Questions exported successfully'
                });
            } else {
                throw new Error(response.data?.message || 'Failed to export questions');
            }
        } catch (error) {
            console.error('Export error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to export questions'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle reset study progress
    const handleResetProgress = async () => {
        if (!window.confirm('Are you sure you want to reset all your study progress? This cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);

            const response = await api.post('/users/reset-study-progress');

            if (response.data && response.data.success) {
                setAlert({
                    type: 'success',
                    message: 'Study progress reset successfully'
                });

                // Refresh the page after a delay to update the UI
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(response.data?.message || 'Failed to reset study progress');
            }
        } catch (error) {
            console.error('Reset progress error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to reset study progress'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This cannot be undone and all your data will be permanently removed.')) {
            return;
        }

        try {
            setLoading(true);

            const response = await api.delete('/users/account');

            if (response.data && response.data.success) {
                setAlert({
                    type: 'success',
                    message: 'Account deleted successfully'
                });

                // Logout and redirect to login page after a delay
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 1500);
            } else {
                throw new Error(response.data?.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to delete account'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle profile field changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-4"
                />
            )}

            {/* Settings Tabs */}
            <div className="mb-6 border-b">
                <div className="flex overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 font-medium ${activeTab === 'profile'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Profile
                    </button>

                    <button
                        onClick={() => setActiveTab('data')}
                        className={`px-4 py-2 font-medium ${activeTab === 'data'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Data Management
                    </button>

                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`px-4 py-2 font-medium ${activeTab === 'privacy'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Privacy
                    </button>

                    <button
                        onClick={() => setActiveTab('prite-scores')}
                        className={`px-4 py-2 font-medium ${activeTab === 'prite-scores'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        PRITE Scores
                    </button>

                    <button
                        onClick={() => setActiveTab('account')}
                        className={`px-4 py-2 font-medium ${activeTab === 'account'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Account
                    </button>
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card p-4">
                    <h3 className="text-lg font-bold mb-4">User Profile</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={profile.username}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md bg-gray-50"
                                disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Display Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={profile.displayName}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter your display name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">PGY Level</label>
                            <select
                                name="pgyLevel"
                                value={profile.pgyLevel}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select PGY Level</option>
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
                            <label className="block text-sm font-medium mb-1">Specialty</label>
                            <select
                                name="specialty"
                                value={profile.specialty}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select Specialty</option>
                                <option value="Psychiatry">Psychiatry</option>
                                <option value="Psychiatry/Neurology">Psychiatry/Neurology</option>
                                <option value="Child Psychiatry">Child Psychiatry</option>
                                <option value="Addiction Psychiatry">Addiction Psychiatry</option>
                                <option value="Forensic Psychiatry">Forensic Psychiatry</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Institution</label>
                            <input
                                type="text"
                                name="institution"
                                value={profile.institution}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                                placeholder="Your training institution"
                            />
                        </div>

                        <button
                            onClick={handleProfileUpdate}
                            className="w-full p-2 bg-primary text-white rounded-md flex justify-center items-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Profile'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Data Management Tab */}
            {activeTab === 'data' && (
                <div>
                    <h3 className="text-lg font-bold mb-4">Data Management</h3>
                    <p className="text-gray-600 mb-4">Manage your study data and question contributions.</p>

                    <div className="space-y-4">
                        <button
                            onClick={handleExportStudyData}
                            className="w-full flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Study Data
                            </div>
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={handleExportQuestions}
                            className="w-full flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export My Questions
                            </div>
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={handleResetProgress}
                            className="w-full flex items-center justify-between p-4 border rounded-md text-red-600 hover:bg-red-50"
                            disabled={loading}
                        >
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Reset Study Progress
                            </div>
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
                <div>
                    <h3 className="text-lg font-bold mb-4">Privacy Settings</h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Share Anonymous Usage Data</h4>
                                <p className="text-sm text-gray-600">
                                    Help improve the app by sharing anonymous usage statistics
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle('shareUsageData')}
                                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${settings.shareUsageData ? 'bg-primary' : 'bg-gray-300'}`}
                                disabled={loading}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${settings.shareUsageData ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Public Profile</h4>
                                <p className="text-sm text-gray-600">
                                    Make your contributions visible to other users
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle('publicProfile')}
                                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${settings.publicProfile ? 'bg-primary' : 'bg-gray-300'}`}
                                disabled={loading}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">About Your Data</h4>
                        <p className="text-sm text-blue-700">
                            We respect your privacy and use your data only to provide and improve the PRITE Study Tool.
                            Your study data is never shared with third parties. Anonymous usage statistics help us
                            understand how the app is used and improve it for everyone.
                        </p>
                    </div>
                </div>
            )}

            {/* PRITE Scores Tab */}
            {activeTab === 'prite-scores' && (
                <PriteScoreHistory />
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
                <div>
                    <h3 className="text-lg font-bold mb-4">Account Actions</h3>

                    <div className="space-y-4">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center p-4 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log Out
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            className="w-full flex items-center justify-center p-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Account
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Warning</h4>
                        <p className="text-sm text-red-700">
                            Deleting your account is permanent and cannot be undone. All your data,
                            including questions, study progress, and settings will be permanently removed.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;