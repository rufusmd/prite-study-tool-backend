// src/components/capture/TextPasteInput.jsx
import { useState } from 'react';

const TextPasteInput = ({ onSubmit, isLoading }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text);
        }
    };

    return (
        <div className="card">
            <h3 className="text-lg font-bold mb-4">Paste Text from Microsoft Lens</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Extracted Text
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="input h-64"
                        placeholder="Paste text from Microsoft Lens here..."
                        required
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Process Text'}
                </button>
            </form>
        </div>
    );
};

export default TextPasteInput;