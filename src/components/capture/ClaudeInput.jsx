// src/components/capture/ClaudeInput.jsx
import { useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';

const ClaudeInput = ({ onProcessed, isLoading }) => {
    const [text, setText] = useState('');
    const [format, setFormat] = useState('json');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setProcessing(true);

        try {
            console.log("Submitting to Claude API...");

            // Use the full path to the Claude API
            // We're using the api utility to ensure proper base URL configuration
            const result = await api.post('/claude', {
                text,
                format
            });

            console.log("Claude API response:", result);

            if (result.data && result.data.success) {
                // If JSON format is selected, try to parse the result
                if (format === 'json') {
                    try {
                        // Clean up the JSON string if needed (remove markdown formatting)
                        let cleanJson = result.data.data;

                        if (typeof result.data.data === 'string') {
                            cleanJson = result.data.data
                                .replace(/```json\s*/g, '')  // Remove opening ```json
                                .replace(/```\s*$/g, '')     // Remove closing ```
                                .trim();                     // Trim any extra whitespace
                        }

                        const parsedData = typeof cleanJson === 'string'
                            ? JSON.parse(cleanJson)
                            : cleanJson;

                        onProcessed(parsedData, true); // Pre-parsed data
                    } catch (error) {
                        console.error('Error parsing JSON from Claude:', error);
                        console.log('Raw response:', result.data.data);
                        onProcessed(result.data.data, false); // Raw text
                    }
                } else {
                    // Handle plain text
                    onProcessed(result.data.data, false);
                }
            } else {
                throw new Error(result.data?.error || 'Failed to process with Claude');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="card">
            <h3 className="text-lg font-bold mb-4">Process PRITE Questions with Claude</h3>

            <div className="card mb-4 bg-gray-50">
                <h4 className="text-md font-bold mb-2">How to use iOS Live Text:</h4>
                <ol className="list-decimal ml-4 text-gray-700">
                    <li className="mb-1">Take a clear photo of PRITE questions</li>
                    <li className="mb-1">Tap and hold on the text in your photo</li>
                    <li className="mb-1">Tap "Select All" then "Copy"</li>
                    <li className="mb-1">Paste the text below</li>
                </ol>
            </div>

            <div className="mb-4">
                <div className="flex gap-2 mb-2">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            name="format"
                            value="json"
                            checked={format === 'json'}
                            onChange={() => setFormat('json')}
                        />
                        <span className="ml-2">JSON Format (Recommended)</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            name="format"
                            value="text"
                            checked={format === 'text'}
                            onChange={() => setFormat('text')}
                        />
                        <span className="ml-2">Plain Text</span>
                    </label>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Paste Text from PRITE Questions:
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="input h-64"
                        placeholder="Paste the copied text from your PRITE questions here..."
                        required
                        disabled={processing || isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary w-full flex justify-center items-center"
                    disabled={processing || isLoading}
                >
                    {processing || isLoading ? (
                        <>
                            <LoadingSpinner size="small" />
                            <span className="ml-2">Processing with Claude...</span>
                        </>
                    ) : (
                        'Process with Claude'
                    )}
                </button>
            </form>
        </div>
    );
};

export default ClaudeInput;