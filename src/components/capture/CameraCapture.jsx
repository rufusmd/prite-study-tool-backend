// src/components/capture/CameraCapture.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { processImageFile } from '../../utils/ocr';

const CameraCapture = ({ onCapture, onError }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const webcamRef = useRef(null);

    // Get available camera devices
    const handleDevices = useCallback(
        mediaDevices => {
            const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
            setDevices(videoDevices);

            // Auto-select rear camera if available (based on label)
            const rearCamera = videoDevices.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear')
            );

            if (rearCamera) {
                setSelectedDeviceId(rearCamera.deviceId);
            } else if (videoDevices.length > 0) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        },
        []
    );

    // Add this in the useEffect hook in CameraCapture.jsx
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(handleDevices)
            .catch(error => {
                console.error("Error accessing media devices:", error);
                onError("Failed to access camera. Please check permissions and try again.");
            });
    }, [handleDevices]);

    // Also update the handleStartCamera function
    const handleStartCamera = () => {
        setIsCameraActive(true);

        // Add a fallback to handle potential camera start issues
        setTimeout(() => {
            if (!webcamRef.current || !webcamRef.current.video) {
                setIsCameraActive(false);
                onError("Camera failed to initialize. Please try again or use file upload instead.");
            }
        }, 3000); // Give it 3 seconds to initialize
    };

    const handleStopCamera = () => {
        setIsCameraActive(false);
    };

    const captureImage = async () => {
        if (!webcamRef.current) return;

        try {
            setIsProcessing(true);

            // Capture image as data URL
            const imageSrc = webcamRef.current.getScreenshot();

            if (!imageSrc) {
                throw new Error('Failed to capture image');
            }

            // Convert data URL to Blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            // Create a File object from Blob
            const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });

            // Process with OCR
            const result = await processImageFile(file);

            if (result.success) {
                onCapture(result.text);
                setIsCameraActive(false);
            } else {
                onError(result.error || 'OCR processing failed');
            }
        } catch (error) {
            console.error('Camera capture error:', error);
            onError(error.message || 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    // Camera constraints
    const videoConstraints = {
        width: { ideal: 1920 },  // Higher resolution for better OCR
        height: { ideal: 1080 },
        facingMode: "environment"
    };

    if (selectedDeviceId) {
        videoConstraints.deviceId = selectedDeviceId;
    }

    // If not active, show button to start camera
    if (!isCameraActive) {
        return (
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                    Capture a picture of your PRITE questions
                </p>
                <button
                    onClick={handleStartCamera}
                    className="mt-4 btn btn-primary w-full flex items-center justify-center"
                >
                    Start Camera
                </button>
            </div>
        );
    }

    // Show active camera view
    return (
        <div className="camera-container">
            <div className="relative">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-auto rounded-lg"
                />

                {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                            <p className="mt-2">Processing...</p>
                        </div>
                    </div>
                )}
            </div>

            {devices.length > 1 && (
                <div className="mt-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Camera
                    </label>
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="input"
                    >
                        {devices.map((device, index) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="camera-controls mt-4 flex justify-center space-x-4">
                <button
                    onClick={handleStopCamera}
                    className="btn btn-secondary flex-1"
                    disabled={isProcessing}
                >
                    Cancel
                </button>

                <button
                    onClick={captureImage}
                    className="btn btn-primary rounded-full h-16 w-16 flex items-center justify-center"
                    disabled={isProcessing}
                >
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CameraCapture;