import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Function to extract text from PDF
export const extractTextFromPdf = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(' ') + '\n';
        }

        // Clean up the extracted text
        const cleanedText = cleanPdfText(fullText);

        return {
            success: true,
            text: cleanedText
        };
    } catch (error) {
        console.error('PDF processing error:', error);
        return {
            success: false,
            error: error.message || 'Failed to extract text from PDF'
        };
    }
};

// Clean up PDF text output
const cleanPdfText = (text) => {
    if (!text) return '';

    // Remove excessive whitespace
    let cleanedText = text.replace(/\s+/g, ' ');

    // Restore line breaks for paragraphs
    cleanedText = cleanedText.replace(/\. /g, '.\n');

    // Fix common formatting issues with questions and options
    cleanedText = cleanedText.replace(/(\d+)\s*[\.,)]\s*/g, '$1. ');  // Fix question numbers
    cleanedText = cleanedText.replace(/([A-E])\s*[\.,)]\s*/g, '$1. '); // Fix option letters

    return cleanedText;
};