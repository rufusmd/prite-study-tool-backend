// src/utils/ocr.js
import { createWorker } from 'tesseract.js';

// Recognize text from an image
export const recognizeText = async (imageData) => {
    try {
        // Create worker with English language
        const worker = await createWorker('eng');

        // Recognize text
        const { data } = await worker.recognize(imageData);

        // Terminate worker
        await worker.terminate();

        return { success: true, text: data.text };
    } catch (error) {
        console.error('OCR error:', error);
        return {
            success: false,
            error: error.message || 'OCR failed to process image'
        };
    }
};

// Clean OCR text to improve recognition quality
export const cleanOcrText = (text) => {
    if (!text) return '';

    // Remove multiple consecutive line breaks
    let cleanedText = text.replace(/\n{3,}/g, '\n\n');

    // Fix common OCR mistakes with question numbers
    cleanedText = cleanedText.replace(/(\d+)[\s]*[\.,;:][\s]*/g, '$1. ');

    // Fix option letters (ensure they have proper formatting)
    cleanedText = cleanedText.replace(/([A-E])[\s]*[\.,;:][\s]*/g, '$1. ');

    return cleanedText;
};

// Process a file with Tesseract OCR
export const processImageFile = async (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const imageData = event.target.result;
                const result = await recognizeText(imageData);
                if (result.success) {
                    resolve({
                        success: true,
                        text: cleanOcrText(result.text)
                    });
                } else {
                    reject(new Error(result.error));
                }
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsDataURL(file);
    });
};