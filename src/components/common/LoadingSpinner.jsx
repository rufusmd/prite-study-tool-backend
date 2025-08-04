// src/components/common/LoadingSpinner.jsx
const LoadingSpinner = ({ fullScreen = false, size = 'medium' }) => {
    const sizeClasses = {
        small: 'h-4 w-4 border-2',
        medium: 'h-8 w-8 border-2',
        large: 'h-12 w-12 border-3'
    };

    const spinnerClass = `animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses[size]}`;

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg">
                    <div className={spinnerClass}></div>
                </div>
            </div>
        );
    }

    return <div className={spinnerClass}></div>;
};

export default LoadingSpinner;