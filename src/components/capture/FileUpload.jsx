// Update FileUpload component to emphasize PDF workflow
import { useRef, useState } from 'react';
import { extractTextFromPdf } from '../../utils/pdfUtils';

const FileUpload = ({ onUpload, onError }) => {
    const fileInputRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);

        try {
            // Handle different file types
            if (file.type === 'application/pdf') {
                // Process PDF using PDF.js
                const result = await extractTextFromPdf(file);

                if (result.success) {
                    onUpload(result.text);
                } else {
                    onError(result.error || 'Failed to process PDF');
                }
            } else if (file.type.startsWith('image/')) {
                // For now, recommend using Microsoft Lens instead of direct image upload
                onError('For best results, please use Microsoft Lens to scan your document and save as PDF');
            } else {
                onError('Please select a PDF file');
            }
        } catch (error) {
            console.error('File processing error:', error);
            onError(error.message || 'An error occurred while processing the file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-600">
                Upload a PDF from Microsoft Lens
            </p>
            <p className="text-xs text-gray-500 mt-1">
                For best results, scan with Microsoft Lens and save as PDF
            </p>
            <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={handleClick}
                className="mt-4 btn btn-primary w-full flex items-center justify-center"
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                    </>
                ) : (
                    'Select PDF File'
                )}
            </button>
        </div>
    );
};

export default FileUpload;