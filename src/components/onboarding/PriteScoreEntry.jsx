// src/components/onboarding/PriteScoreEntry.jsx
import { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import priteScoreApi from '../../api/priteScoreApi';

const PriteScoreEntry = ({ user, onComplete, initialData = null, isOnboarding = false }) => {
    const [scoreData, setScoreData] = useState({
        year: new Date().getFullYear().toString(),
        overallPercentile: '',
        psychiatryPercentile: '',
        neurosciencePercentile: '',
        somaPercentile: '',
        growthPercentile: '',
        notes: '',
        sections: []
    });

    const [sectionInputs, setSectionInputs] = useState([
        { name: '', percentile: '' }
    ]);

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    // If initial data is provided, use it
    useEffect(() => {
        if (initialData) {
            setScoreData(initialData);

            if (initialData.sections && initialData.sections.length > 0) {
                setSectionInputs(initialData.sections.map(section => ({
                    name: section.name,
                    percentile: section.percentile.toString()
                })));
            }
        }
    }, [initialData]);

    // Handle input change for main scores
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // For percentile fields, only allow numbers between 0-99
        if (name.includes('Percentile')) {
            const numValue = value === '' ? '' : parseInt(value, 10);

            if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 99)) {
                return;
            }

            setScoreData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setScoreData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle section input changes
    const handleSectionChange = (index, field, value) => {
        const updatedSections = [...sectionInputs];

        if (field === 'percentile') {
            // Only allow numbers between 0-99
            const numValue = value === '' ? '' : parseInt(value, 10);

            if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 99)) {
                return;
            }

            updatedSections[index][field] = value;
        } else {
            updatedSections[index][field] = value;
        }

        setSectionInputs(updatedSections);
    };

    // Add a new section input
    const addSectionInput = () => {
        setSectionInputs([...sectionInputs, { name: '', percentile: '' }]);
    };

    // Remove a section input
    const removeSectionInput = (index) => {
        const updatedSections = sectionInputs.filter((_, i) => i !== index);
        setSectionInputs(updatedSections);
    };

    // Save the PRITE score data
    const saveScores = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!scoreData.year || !scoreData.overallPercentile) {
                setAlert({
                    type: 'error',
                    message: 'Year and Overall Percentile are required'
                });
                return;
            }

            // Process section inputs
            const validSections = sectionInputs
                .filter(section => section.name.trim() && section.percentile)
                .map(section => ({
                    name: section.name.trim(),
                    percentile: parseInt(section.percentile, 10)
                }));

            // Create the final score object
            const finalScoreData = {
                year: scoreData.year,
                overallPercentile: parseInt(scoreData.overallPercentile, 10),
                psychiatryPercentile: scoreData.psychiatryPercentile ? parseInt(scoreData.psychiatryPercentile, 10) : null,
                neurosciencePercentile: scoreData.neurosciencePercentile ? parseInt(scoreData.neurosciencePercentile, 10) : null,
                somaPercentile: scoreData.somaPercentile ? parseInt(scoreData.somaPercentile, 10) : null,
                growthPercentile: scoreData.growthPercentile ? parseInt(scoreData.growthPercentile, 10) : null,
                sections: validSections,
                notes: scoreData.notes || ''
            };

            let response;

            // Update or create based on whether we have initial data
            if (initialData && initialData._id) {
                response = await priteScoreApi.updateScore(initialData._id, finalScoreData);
            } else {
                response = await priteScoreApi.createScore(finalScoreData);
            }

            if (response.success) {
                setAlert({
                    type: 'success',
                    message: 'PRITE scores saved successfully'
                });

                // Wait a moment then complete
                setTimeout(() => {
                    if (onComplete) {
                        onComplete(response.score);
                    }
                }, 1500);
            } else {
                throw new Error(response.error || 'Failed to save PRITE scores');
            }
        } catch (error) {
            console.error('Error saving PRITE scores:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to save PRITE scores'
            });
        } finally {
            setLoading(false);
        }
    };

    // Skip score entry (only available during onboarding)
    const handleSkip = () => {
        if (onComplete) {
            onComplete(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                    {isOnboarding ? 'Enter Your PRITE Scores' : 'Update PRITE Scores'}
                </h2>

                <p className="text-gray-600 mb-4">
                    {isOnboarding
                        ? 'Help us track your progress by entering your most recent PRITE exam scores. This data will help measure your improvement over time.'
                        : 'Update your PRITE scores with your most recent exam results.'}
                </p>

                {isOnboarding && (
                    <p className="text-sm text-blue-600 mb-4">
                        You can find your percentile scores in your PRITE score report. This information is optional but recommended.
                    </p>
                )}
            </div>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-4"
                />
            )}

            <div className="card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">PRITE Exam Year*</label>
                        <select
                            name="year"
                            value={scoreData.year}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md"
                            required
                        >
                            {[0, 1, 2, 3, 4].map(offset => {
                                const year = (new Date().getFullYear() - offset).toString();
                                return (
                                    <option key={year} value={year}>{year}</option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Overall Percentile* (0-99)
                        </label>
                        <input
                            type="number"
                            name="overallPercentile"
                            value={scoreData.overallPercentile}
                            onChange={handleInputChange}
                            min="0"
                            max="99"
                            className="w-full p-2 border rounded-md"
                            placeholder="e.g., 75"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your overall percentile rank compared to other residents nationally
                        </p>
                    </div>
                </div>

                <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-3">Major Categories (Optional)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Psychiatry Percentile (0-99)
                            </label>
                            <input
                                type="number"
                                name="psychiatryPercentile"
                                value={scoreData.psychiatryPercentile}
                                onChange={handleInputChange}
                                min="0"
                                max="99"
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g., 80"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Neuroscience Percentile (0-99)
                            </label>
                            <input
                                type="number"
                                name="neurosciencePercentile"
                                value={scoreData.neurosciencePercentile}
                                onChange={handleInputChange}
                                min="0"
                                max="99"
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g., 65"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Somatic Treatments Percentile (0-99)
                            </label>
                            <input
                                type="number"
                                name="somaPercentile"
                                value={scoreData.somaPercentile}
                                onChange={handleInputChange}
                                min="0"
                                max="99"
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g., 70"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Growth & Development Percentile (0-99)
                            </label>
                            <input
                                type="number"
                                name="growthPercentile"
                                value={scoreData.growthPercentile}
                                onChange={handleInputChange}
                                min="0"
                                max="99"
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g., 75"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Additional Sections (Optional)</h3>
                        <button
                            type="button"
                            onClick={addSectionInput}
                            className="text-sm text-primary hover:text-primary-dark"
                        >
                            + Add Section
                        </button>
                    </div>

                    {sectionInputs.map((section, index) => (
                        <div key={index} className="flex items-center gap-2 mb-3">
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    value={section.name}
                                    onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Section name"
                                />
                            </div>

                            <div className="w-24">
                                <input
                                    type="number"
                                    value={section.percentile}
                                    onChange={(e) => handleSectionChange(index, 'percentile', e.target.value)}
                                    min="0"
                                    max="99"
                                    className="w-full p-2 border rounded-md"
                                    placeholder="%"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => removeSectionInput(index)}
                                className="text-gray-400 hover:text-red-500"
                                aria-label="Remove section"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium mb-1">Additional Notes (Optional)</label>
                    <textarea
                        name="notes"
                        value={scoreData.notes}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        rows="3"
                        placeholder="Any additional notes about your PRITE results"
                    ></textarea>
                </div>
            </div>

            <div className="flex justify-between">
                {isOnboarding && (
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="px-4 py-2 border rounded-md"
                    >
                        Skip for Now
                    </button>
                )}

                <button
                    type="button"
                    onClick={saveScores}
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-md flex items-center ml-auto"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Saving...
                        </>
                    ) : (
                        'Save PRITE Scores'
                    )}
                </button>
            </div>
        </div>
    );
};

export default PriteScoreEntry;