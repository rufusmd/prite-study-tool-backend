// src/components/onboarding/OnboardingFlow.jsx
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import PriteScoreEntry from './PriteScoreEntry';
import api from '../../utils/api';

const OnboardingFlow = () => {
    const { user, updateUserProfile } = useContext(AuthContext);
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [formData, setFormData] = useState({
        pgyLevel: '',
        specialty: 'Psychiatry',
        institution: '',
        studyPreferences: {
            questionsPerSession: 20,
            showExplanations: true,
            enableReminders: false
        }
    });

    // If user already has profile data, pre-fill the form
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                pgyLevel: user.pgyLevel || '',
                specialty: user.specialty || 'Psychiatry',
                institution: user.institution || ''
            }));
        }
    }, [user]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            // Handle nested properties (e.g., studyPreferences.questionsPerSession)
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle checkbox changes
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested properties
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: checked
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        }
    };

    // Save profile data to API
    const saveProfileData = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!formData.pgyLevel) {
                setAlert({
                    type: 'error',
                    message: 'Please select your PGY level'
                });
                return;
            }

            // Save preferences to localStorage for quick access on client side
            localStorage.setItem('userPreferences', JSON.stringify(formData.studyPreferences));

            // Save profile data to server
            const response = await api.put('/users/profile', {
                pgyLevel: formData.pgyLevel,
                specialty: formData.specialty,
                institution: formData.institution,
                onboardingStep: 1 // Mark that we've completed step 1
            });

            if (response.data && response.data.success) {
                // Update user context with new profile data
                if (updateUserProfile) {
                    updateUserProfile(response.data.user);
                }

                // Go to next step
                setStep(2);
            } else {
                throw new Error('Failed to update profile');
            }

        } catch (error) {
            console.error('Error saving profile data:', error);

            // Fallback to localStorage if API fails
            const updatedUser = {
                ...user,
                ...formData,
                onboardingStep: 1
            };

            localStorage.setItem('userProfile', JSON.stringify(updatedUser));

            // Still update user context
            if (updateUserProfile) {
                updateUserProfile(updatedUser);
            }

            // Show warning but continue
            setAlert({
                type: 'warning',
                message: 'Profile saved locally. Some features may be limited until you reconnect.'
            });

            // Still advance to next step
            setTimeout(() => setStep(2), 1500);
        } finally {
            setLoading(false);
        }
    };

    // Handle PRITE score completion
    const handleScoreComplete = (scoreData) => {
        // Update onboarding step in user context
        if (updateUserProfile && user) {
            const updatedUser = {
                ...user,
                onboardingStep: 2
            };
            updateUserProfile(updatedUser);

            // Update in localStorage as fallback
            localStorage.setItem('userProfile', JSON.stringify(updatedUser));
        }

        // Move to final step (regardless of whether they entered scores or skipped)
        setStep(3);
    };

    // Complete onboarding
    const completeOnboarding = async () => {
        try {
            setLoading(true);

            // Mark onboarding as complete via API
            const response = await api.put('/users/profile', {
                onboardingComplete: true,
                onboardingStep: 3
            });

            if (response.data && response.data.success) {
                // Update user context
                if (updateUserProfile) {
                    updateUserProfile(response.data.user);
                }
            } else {
                throw new Error('Failed to update profile');
            }

        } catch (error) {
            console.error('Error completing onboarding:', error);

            // Fallback to localStorage
            const currentUser = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const updatedUser = {
                ...currentUser,
                onboardingComplete: true,
                onboardingStep: 3
            };

            localStorage.setItem('userProfile', JSON.stringify(updatedUser));

            // Update user context
            if (updateUserProfile) {
                updateUserProfile(updatedUser);
            }

            setAlert({
                type: 'warning',
                message: 'Profile saved locally. Some features may be limited until you reconnect.'
            });
        } finally {
            setLoading(false);

            // Redirect to home page (regardless of API success)
            navigate('/');
        }
    };

    // Render the appropriate step

    // Step 1: Basic Profile Information
    if (step === 1) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">Welcome to PRITE Study Tool!</h2>
                    <p className="text-gray-600">
                        Let's set up your profile to personalize your study experience.
                    </p>
                </div>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="card p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Your Training Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Training Level*</label>
                            <select
                                name="pgyLevel"
                                value={formData.pgyLevel}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                required
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
                                value={formData.specialty}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="Psychiatry">Psychiatry</option>
                                <option value="Psychiatry/Neurology">Psychiatry/Neurology</option>
                                <option value="Child Psychiatry">Child Psychiatry</option>
                                <option value="Addiction Psychiatry">Addiction Psychiatry</option>
                                <option value="Forensic Psychiatry">Forensic Psychiatry</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Institution (Optional)</label>
                        <input
                            type="text"
                            name="institution"
                            value={formData.institution}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md"
                            placeholder="Your training institution"
                        />
                    </div>
                </div>

                <div className="card p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Study Preferences</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Questions Per Study Session</label>
                        <select
                            name="studyPreferences.questionsPerSession"
                            value={formData.studyPreferences.questionsPerSession}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="10">10 questions</option>
                            <option value="20">20 questions</option>
                            <option value="30">30 questions</option>
                            <option value="50">50 questions</option>
                        </select>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="showExplanations"
                            name="studyPreferences.showExplanations"
                            checked={formData.studyPreferences.showExplanations}
                            onChange={handleCheckboxChange}
                            className="mr-2"
                        />
                        <label htmlFor="showExplanations">
                            Show explanations after answering
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="enableReminders"
                            name="studyPreferences.enableReminders"
                            checked={formData.studyPreferences.enableReminders}
                            onChange={handleCheckboxChange}
                            className="mr-2"
                        />
                        <label htmlFor="enableReminders">
                            Enable study reminders
                        </label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={saveProfileData}
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-white rounded-md flex items-center"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Step 2: PRITE Score Entry
    if (step === 2) {
        return <PriteScoreEntry user={user} onComplete={handleScoreComplete} isOnboarding={true} />;
    }

    // Step 3: Final Step
    if (step === 3) {
        return (
            <div className="max-w-3xl mx-auto text-center">
                <svg className="mx-auto h-16 w-16 text-success mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-gray-600 mb-6">
                    Your profile has been created successfully. You're now ready to start studying for the PRITE exam!
                </p>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="card p-6 mb-6 text-left">
                    <h3 className="font-bold mb-4">What's Next?</h3>

                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Start a study session to review questions due for review</li>
                        <li>Add new questions by capturing them with your camera</li>
                        <li>Browse and search through the question database</li>
                        <li>Track your performance and improvement over time</li>
                    </ul>
                </div>

                <button
                    onClick={completeOnboarding}
                    disabled={loading}
                    className="px-6 py-3 bg-primary text-white rounded-md flex items-center justify-center mx-auto"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Loading...
                        </>
                    ) : (
                        'Start Using PRITE Study Tool'
                    )}
                </button>
            </div>
        );
    }

    // Fallback (should never happen)
    return <LoadingSpinner />;
};

export default OnboardingFlow;