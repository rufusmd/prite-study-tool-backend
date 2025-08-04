// src/components/common/Alert.jsx
import { useEffect } from 'react';

const Alert = ({ type = 'info', message, onClose, autoClose = 5000 }) => {
    useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoClose);

            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose]);

    const alertStyles = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        error: 'bg-red-50 text-red-800 border-red-200'
    };

    return (
        <div className={`relative p-4 border rounded-md ${alertStyles[type]}`}>
            <div className="flex items-start">
                <div className="flex-grow">
                    {message}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        type="button"
                        className="ml-3 -mt-1 -mr-1 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Alert;