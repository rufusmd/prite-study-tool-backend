// src/components/capture/ImageUploader.jsx
import { useRef, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

const ImageUploader = ({ onUpload, onProcessed, isProcessing }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Pass file to parent component
        onUpload(file);
    };

    const clearImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setPreview(null);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="card p-4">
            <h3 className="text-lg font-bold mb-4">Upload PRITE Question Image</h3>

            {!preview ? (
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
                    onClick={triggerFileInput}
                >
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                        Click to select an image or take a photo
                    </p>
                </div>
            ) : (
                <div className="relative mb-4">
                    <img
                        src={preview}
                        alt="Question preview"
                        className="w-full h-auto rounded-lg object-contain max-h-64"
                    />
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="text-white text-center">
                                <LoadingSpinner size="large" />
                                <p className="mt-2">Processing with Claude...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex justify-between mt-4">
                {preview && (
                    <button
                        onClick={clearImage}
                        className="btn btn-secondary"
                        disabled={isProcessing}
                    >
                        Clear Image
                    </button>
                )}

                {preview && (
                    <button
                        onClick={onProcessed}
                        className="btn btn-primary"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Processing...</span>
                            </>
                        ) : (
                            'Process with Claude'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;