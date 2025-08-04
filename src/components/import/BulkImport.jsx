// src/components/import/BulkImportComponent.jsx
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import api from '../../utils/api';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { PRITE_CATEGORIES } from '../../constants/categories';

const BulkImport = () => {
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState([]);
    const [preview, setPreview] = useState([]);
    const [importOptions, setImportOptions] = useState({
        part: '1',
        year: new Date().getFullYear().toString(),
        format: 'standard', // 'standard', 'questionPerRow', or 'qaFormat'
        headerRow: 0,
        questionColumn: '',
        optionAColumn: '',
        optionBColumn: '',
        optionCColumn: '',
        optionDColumn: '',
        optionEColumn: '',
        answerColumn: '',
        categoryColumn: '',
        hasOptions: true,
        hasCategory: false
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Configure, 3: Preview, 4: Complete
    const [alert, setAlert] = useState(null);
    const [columnHeaders, setColumnHeaders] = useState([]);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        imported: 0,
        errors: 0
    });

    const fileInputRef = useRef(null);

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        processFile(selectedFile);
    };

    // Process the uploaded file
    const processFile = async (file) => {
        setIsProcessing(true);
        setAlert(null);

        try {
            let data = [];
            let headers = [];

            // Process based on file type
            if (file.name.endsWith('.csv')) {
                // Parse CSV
                const text = await file.text();
                const result = Papa.parse(text, {
                    header: false,
                    skipEmptyLines: true
                });

                data = result.data;
                setFileData(data);

                if (data.length > 0) {
                    // Use the first row as headers
                    headers = data[0].map((header, index) => ({
                        label: header || `Column ${index + 1}`,
                        value: index.toString()
                    }));

                    setColumnHeaders(headers);

                    // Try to auto-detect columns by name
                    const findColumn = (pattern) => {
                        const index = headers.findIndex(h =>
                            h.label && h.label.toString().toLowerCase().includes(pattern)
                        );
                        return index !== -1 ? index.toString() : '';
                    };

                    setImportOptions(prev => ({
                        ...prev,
                        questionColumn: findColumn('question'),
                        optionAColumn: findColumn('a') || findColumn('option a'),
                        optionBColumn: findColumn('b') || findColumn('option b'),
                        optionCColumn: findColumn('c') || findColumn('option c'),
                        optionDColumn: findColumn('d') || findColumn('option d'),
                        optionEColumn: findColumn('e') || findColumn('option e'),
                        answerColumn: findColumn('answer') || findColumn('correct'),
                        categoryColumn: findColumn('category') || findColumn('topic')
                    }));

                    // Auto-detect format
                    if (findColumn('a') || findColumn('option a')) {
                        setImportOptions(prev => ({
                            ...prev,
                            format: 'questionPerRow',
                            hasOptions: true
                        }));
                    }
                }
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Parse Excel
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                setFileData(data);

                if (data.length > 0) {
                    // Use the first row as headers
                    headers = data[0].map((header, index) => ({
                        label: header || `Column ${index + 1}`,
                        value: index.toString()
                    }));

                    setColumnHeaders(headers);

                    // Try to auto-detect columns by name
                    const findColumn = (pattern) => {
                        const index = headers.findIndex(h => {
                            return h.label && h.label.toString().toLowerCase().includes(pattern);
                        });
                        return index !== -1 ? index.toString() : '';
                    };

                    setImportOptions(prev => ({
                        ...prev,
                        questionColumn: findColumn('question'),
                        optionAColumn: findColumn('a') || findColumn('option a'),
                        optionBColumn: findColumn('b') || findColumn('option b'),
                        optionCColumn: findColumn('c') || findColumn('option c'),
                        optionDColumn: findColumn('d') || findColumn('option d'),
                        optionEColumn: findColumn('e') || findColumn('option e'),
                        answerColumn: findColumn('answer') || findColumn('correct'),
                        categoryColumn: findColumn('category') || findColumn('topic')
                    }));

                    // Auto-detect format
                    if (findColumn('a') || findColumn('option a')) {
                        setImportOptions(prev => ({
                            ...prev,
                            format: 'questionPerRow',
                            hasOptions: true
                        }));
                    }
                }
            } else {
                throw new Error("Unsupported file format. Please upload a CSV or Excel file.");
            }

            // Show preview
            setPreview(data.slice(0, 10)); // Show first 10 rows as preview
            setCurrentStep(2); // Move to configure step

        } catch (error) {
            console.error("File processing error:", error);
            setAlert({
                type: 'error',
                message: error.message || "Failed to process file"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Generate preview of parsed questions
    const generateQuestionPreview = () => {
        if (preview.length === 0 || !importOptions.questionColumn) {
            return [];
        }

        const headerRowIndex = parseInt(importOptions.headerRow);
        const questionsPreview = [];

        // Skip header row
        const dataRows = preview.slice(headerRowIndex + 1);

        if (importOptions.format === 'questionPerRow') {
            // Each row has a question and all its options in different columns
            dataRows.forEach((row, index) => {
                if (!row || !row[parseInt(importOptions.questionColumn)]) return;

                const questionText = row[parseInt(importOptions.questionColumn)];

                // Build options object
                const options = {};
                if (importOptions.hasOptions) {
                    const optionColumns = {
                        'A': importOptions.optionAColumn ? parseInt(importOptions.optionAColumn) : null,
                        'B': importOptions.optionBColumn ? parseInt(importOptions.optionBColumn) : null,
                        'C': importOptions.optionCColumn ? parseInt(importOptions.optionCColumn) : null,
                        'D': importOptions.optionDColumn ? parseInt(importOptions.optionDColumn) : null,
                        'E': importOptions.optionEColumn ? parseInt(importOptions.optionEColumn) : null
                    };

                    Object.entries(optionColumns).forEach(([letter, colIndex]) => {
                        if (colIndex !== null && row[colIndex]) {
                            options[letter] = row[colIndex].toString();
                        } else {
                            options[letter] = '';
                        }
                    });
                }

                // Get correct answer
                let correctAnswer = '';
                if (importOptions.answerColumn && row[parseInt(importOptions.answerColumn)]) {
                    const answerValue = row[parseInt(importOptions.answerColumn)].toString().trim();
                    // Extract the first letter if it's multiple characters
                    correctAnswer = answerValue.charAt(0).toUpperCase();

                    // Validate that it's A-E
                    if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) {
                        correctAnswer = '';
                    }
                }

                // Get category
                let category = '';
                if (importOptions.hasCategory && importOptions.categoryColumn && row[parseInt(importOptions.categoryColumn)]) {
                    category = row[parseInt(importOptions.categoryColumn)].toString().trim();
                }

                // Create question object
                const question = {
                    text: questionText,
                    options,
                    correctAnswer,
                    category,
                    part: importOptions.part,
                    year: importOptions.year
                };

                questionsPreview.push(question);
            });
        } else if (importOptions.format === 'standard') {
            // Standard format: Question follows by options A-E in sequence
            let currentQuestion = null;
            let currentOptions = {};
            let currentNum = 0;

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row || row.length === 0) continue;

                const cellContent = row[parseInt(importOptions.questionColumn)];
                if (!cellContent) continue;

                const content = cellContent.toString().trim();

                // Check if it starts with a number (likely a new question)
                const questionMatch = content.match(/^(\d+)[.\)]\s*(.*)/);

                if (questionMatch) {
                    // Save previous question if exists
                    if (currentQuestion && Object.keys(currentOptions).length > 0) {
                        questionsPreview.push({
                            number: currentNum.toString(),
                            text: currentQuestion,
                            options: { ...currentOptions },
                            correctAnswer: '',
                            category: '',
                            part: importOptions.part,
                            year: importOptions.year
                        });

                        // Stop at preview limit
                        if (questionsPreview.length >= 5) break;
                    }

                    // Start new question
                    currentNum = parseInt(questionMatch[1]);
                    currentQuestion = questionMatch[2];
                    currentOptions = {};
                }
                // Check if it's an option (A, B, C, D, E)
                else if (currentQuestion) {
                    const optionMatch = content.match(/^([A-E])[.\)]\s*(.*)/);

                    if (optionMatch) {
                        const letter = optionMatch[1];
                        const optionText = optionMatch[2];
                        currentOptions[letter] = optionText;
                    } else {
                        // Append to current question if not empty
                        currentQuestion += " " + content;
                    }
                }
            }

            // Add the last question
            if (currentQuestion && Object.keys(currentOptions).length > 0) {
                questionsPreview.push({
                    number: currentNum.toString(),
                    text: currentQuestion,
                    options: { ...currentOptions },
                    correctAnswer: '',
                    category: '',
                    part: importOptions.part,
                    year: importOptions.year
                });
            }
        } else if (importOptions.format === 'qaFormat') {
            // Q&A format: Each question on one row, then answer on next row
            let isQuestion = true;
            let currentQuestion = null;
            let questionCount = 0;

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row || row.length === 0) continue;

                const cellContent = row[parseInt(importOptions.questionColumn)];
                if (!cellContent) continue;

                const content = cellContent.toString().trim();

                if (isQuestion) {
                    currentQuestion = {
                        text: content,
                        options: { A: '', B: '', C: '', D: '', E: '' },
                        correctAnswer: '',
                        category: '',
                        part: importOptions.part,
                        year: importOptions.year
                    };
                    isQuestion = false;
                } else {
                    // This is the answer row
                    const answerMatch = content.match(/([A-E])/);
                    if (answerMatch) {
                        currentQuestion.correctAnswer = answerMatch[1];
                    }

                    questionsPreview.push(currentQuestion);
                    questionCount++;

                    // Stop at preview limit
                    if (questionCount >= 5) break;

                    isQuestion = true;
                    currentQuestion = null;
                }
            }
        }

        return questionsPreview;
    };

    // Parse questions from file data
    const parseQuestions = () => {
        if (fileData.length === 0 || !importOptions.questionColumn) {
            return [];
        }

        const headerRowIndex = parseInt(importOptions.headerRow);
        const questions = [];

        // Skip header row
        const dataRows = fileData.slice(headerRowIndex + 1);

        try {
            if (importOptions.format === 'questionPerRow') {
                // Each row has a question and all its options in different columns
                dataRows.forEach((row, index) => {
                    if (!row || !row[parseInt(importOptions.questionColumn)]) return;

                    const questionText = row[parseInt(importOptions.questionColumn)];

                    // Build options object
                    const options = { A: '', B: '', C: '', D: '', E: '' };
                    if (importOptions.hasOptions) {
                        const optionColumns = {
                            'A': importOptions.optionAColumn ? parseInt(importOptions.optionAColumn) : null,
                            'B': importOptions.optionBColumn ? parseInt(importOptions.optionBColumn) : null,
                            'C': importOptions.optionCColumn ? parseInt(importOptions.optionCColumn) : null,
                            'D': importOptions.optionDColumn ? parseInt(importOptions.optionDColumn) : null,
                            'E': importOptions.optionEColumn ? parseInt(importOptions.optionEColumn) : null
                        };

                        Object.entries(optionColumns).forEach(([letter, colIndex]) => {
                            if (colIndex !== null && row[colIndex]) {
                                options[letter] = row[colIndex].toString();
                            }
                        });
                    }

                    // Get correct answer
                    let correctAnswer = '';
                    if (importOptions.answerColumn && row[parseInt(importOptions.answerColumn)]) {
                        const answerValue = row[parseInt(importOptions.answerColumn)].toString().trim();
                        // Extract the first letter if it's multiple characters
                        correctAnswer = answerValue.charAt(0).toUpperCase();

                        // Validate that it's A-E
                        if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) {
                            correctAnswer = '';
                        }
                    }

                    // Get category
                    let category = '';
                    if (importOptions.hasCategory && importOptions.categoryColumn && row[parseInt(importOptions.categoryColumn)]) {
                        category = row[parseInt(importOptions.categoryColumn)].toString().trim();
                    }

                    // Create question object
                    const question = {
                        text: questionText,
                        options,
                        correctAnswer,
                        category,
                        part: importOptions.part,
                        year: importOptions.year
                    };

                    questions.push(question);
                });
            } else if (importOptions.format === 'standard') {
                // Standard format: Question follows by options A-E in sequence
                let currentQuestion = null;
                let currentOptions = { A: '', B: '', C: '', D: '', E: '' };
                let currentNum = 0;
                let currentCategory = '';

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    if (!row || row.length === 0) continue;

                    const cellContent = row[parseInt(importOptions.questionColumn)];
                    if (!cellContent) continue;

                    const content = cellContent.toString().trim();

                    // Check if it's a category marker
                    if (importOptions.hasCategory && importOptions.categoryColumn) {
                        const categoryContent = row[parseInt(importOptions.categoryColumn)];
                        if (categoryContent && categoryContent.toString().trim()) {
                            currentCategory = categoryContent.toString().trim();
                        }
                    }

                    // Check if it starts with a number (likely a new question)
                    const questionMatch = content.match(/^(\d+)[.\)]\s*(.*)/);

                    if (questionMatch) {
                        // Save previous question if exists
                        if (currentQuestion && Object.keys(currentOptions).some(key => currentOptions[key])) {
                            questions.push({
                                number: currentNum.toString(),
                                text: currentQuestion,
                                options: { ...currentOptions },
                                correctAnswer: '',
                                category: currentCategory,
                                part: importOptions.part,
                                year: importOptions.year
                            });
                        }

                        // Start new question
                        currentNum = parseInt(questionMatch[1]);
                        currentQuestion = questionMatch[2];
                        currentOptions = { A: '', B: '', C: '', D: '', E: '' };
                    }
                    // Check if it's an option (A, B, C, D, E)
                    else if (currentQuestion) {
                        const optionMatch = content.match(/^([A-E])[.\)]\s*(.*)/);

                        if (optionMatch) {
                            const letter = optionMatch[1];
                            const optionText = optionMatch[2];
                            currentOptions[letter] = optionText;
                        } else {
                            // Append to current question if not empty
                            currentQuestion += " " + content;
                        }
                    }
                }

                // Add the last question
                if (currentQuestion && Object.keys(currentOptions).some(key => currentOptions[key])) {
                    questions.push({
                        number: currentNum.toString(),
                        text: currentQuestion,
                        options: { ...currentOptions },
                        correctAnswer: '',
                        category: currentCategory,
                        part: importOptions.part,
                        year: importOptions.year
                    });
                }
            } else if (importOptions.format === 'qaFormat') {
                // Q&A format: Each question on one row, then answer on next row
                let isQuestion = true;
                let currentQuestion = null;

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    if (!row || row.length === 0) continue;

                    const cellContent = row[parseInt(importOptions.questionColumn)];
                    if (!cellContent) continue;

                    const content = cellContent.toString().trim();

                    if (isQuestion) {
                        currentQuestion = {
                            text: content,
                            options: { A: '', B: '', C: '', D: '', E: '' },
                            correctAnswer: '',
                            category: '',
                            part: importOptions.part,
                            year: importOptions.year
                        };
                        isQuestion = false;
                    } else {
                        // This is the answer row
                        const answerMatch = content.match(/([A-E])/);
                        if (answerMatch) {
                            currentQuestion.correctAnswer = answerMatch[1];
                        }

                        questions.push(currentQuestion);
                        isQuestion = true;
                        currentQuestion = null;
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing questions:", error);
            setAlert({
                type: 'error',
                message: `Error parsing questions: ${error.message}`
            });
        }

        return questions;
    };

    // Start the import process
    const startImport = async () => {
        setIsProcessing(true);
        setAlert(null);

        try {
            // Verify required fields
            if (!importOptions.questionColumn) {
                throw new Error("Question column is required");
            }

            // Parse questions based on the configured format
            const questions = parseQuestions();

            if (questions.length === 0) {
                throw new Error("No valid questions found. Please check your file format and import settings.");
            }

            // Set parsed questions for preview
            setParsedQuestions(questions);
            setCurrentStep(3); // Move to preview step
            setStats({
                total: questions.length,
                imported: 0,
                errors: 0
            });

        } catch (error) {
            console.error("Parsing error:", error);
            setAlert({
                type: 'error',
                message: error.message || "Failed to parse questions"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Save the parsed questions to the database
    const saveQuestions = async () => {
        setIsProcessing(true);
        setAlert(null);

        try {
            // Save questions to database
            const response = await api.post('/questions/bulk', { questions: parsedQuestions });

            if (response.data) {
                setStats(prev => ({
                    ...prev,
                    imported: response.data.length,
                    errors: prev.total - response.data.length
                }));
                setCurrentStep(4); // Move to complete step
            } else {
                throw new Error("Failed to import questions");
            }
        } catch (error) {
            console.error("Import error:", error);
            setAlert({
                type: 'error',
                message: error.message || "Failed to import questions"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle option changes
    const handleOptionChange = (field, value) => {
        setImportOptions(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Step 1: File Upload
    if (currentStep === 1) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Bulk Import PRITE Questions</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="mb-6">
                    <p className="text-gray-600 mb-2">
                        Upload a CSV or Excel file containing PRITE questions to import them in bulk.
                    </p>
                    <p className="text-gray-600 mb-4">
                        The file should contain columns for questions, answer options, and optionally category and correct answers.
                    </p>

                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                            Click to select a file or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            CSV or Excel files only
                        </p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        className="hidden"
                    />
                </div>

                <div className="mt-6">
                    <h3 className="font-bold mb-2">Supported Formats:</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li><span className="font-medium">Standard Format</span>: Questions followed by options A-E in sequence</li>
                        <li><span className="font-medium">Question Per Row</span>: Each row has a question with options in separate columns</li>
                        <li><span className="font-medium">Q&A Format</span>: Question on one row, answer on the next</li>
                    </ul>
                </div>
            </div>
        );
    }

    // Step 2: Configure Import
    if (currentStep === 2) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Configure Import</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="mb-6">
                    <h3 className="font-bold mb-2">File Preview:</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    {preview[0]?.map((cell, index) => (
                                        <th key={index} className="px-4 py-2 border text-left">
                                            {cell || `Column ${index + 1}`}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.slice(1, 6).map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50">
                                        {row?.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-2 border">
                                                {cell || ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold mb-2">Import Settings:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Part</label>
                            <select
                                value={importOptions.part}
                                onChange={(e) => handleOptionChange('part', e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="1">Part 1</option>
                                <option value="2">Part 2</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Year</label>
                            <select
                                value={importOptions.year}
                                onChange={(e) => handleOptionChange('year', e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                                <option value="2020">2020</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Format Type</label>
                        <select
                            value={importOptions.format}
                            onChange={(e) => handleOptionChange('format', e.target.value)}
                            className="w-full p-2 border rounded-md mb-2"
                        >
                            <option value="standard">Standard Format (Question followed by options A-E)</option>
                            <option value="questionPerRow">Question Per Row (Options in columns)</option>
                            <option value="qaFormat">Q&A Format (Question & answer in separate rows)</option>
                        </select>
                        <p className="text-xs text-gray-500 mb-4">
                            {importOptions.format === 'standard' &&
                                "Standard format: Each question starts with a number, followed by the question text, then options A-E on separate lines"}
                            {importOptions.format === 'questionPerRow' &&
                                "Question per row: Each row contains a question with options in separate columns"}
                            {importOptions.format === 'qaFormat' &&
                                "Q&A format: Each question appears on one row, followed by the answer on the next row"}
                        </p>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Header Row</label>
                        <select
                            value={importOptions.headerRow}
                            onChange={(e) => handleOptionChange('headerRow', e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            {preview.map((_, index) => (
                                <option key={index} value={index}>
                                    Row {index + 1}
                                </option>
                            )).slice(0, 5)}
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Question Column</label>
                        <select
                            value={importOptions.questionColumn}
                            onChange={(e) => handleOptionChange('questionColumn', e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Question Column</option>
                            {columnHeaders.map(header => (
                                <option key={header.value} value={header.value}>
                                    {header.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {importOptions.format === 'questionPerRow' && (
                        <div className="mt-4 border-t pt-4">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="hasOptions"
                                    checked={importOptions.hasOptions}
                                    onChange={(e) => handleOptionChange('hasOptions', e.target.checked)}
                                    className="mr-2"
                                />
                                <label htmlFor="hasOptions" className="text-sm font-medium">
                                    File includes answer options in separate columns
                                </label>
                            </div>

                            {importOptions.hasOptions && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Option A Column</label>
                                        <select
                                            value={importOptions.optionAColumn}
                                            onChange={(e) => handleOptionChange('optionAColumn', e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Option A Column</option>
                                            {columnHeaders.map(header => (
                                                <option key={header.value} value={header.value}>
                                                    {header.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Option B Column</label>
                                        <select
                                            value={importOptions.optionBColumn}
                                            onChange={(e) => handleOptionChange('optionBColumn', e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Option B Column</option>
                                            {columnHeaders.map(header => (
                                                <option key={header.value} value={header.value}>
                                                    {header.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Option C Column</label>
                                        <select
                                            value={importOptions.optionCColumn}
                                            onChange={(e) => handleOptionChange('optionCColumn', e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Option C Column</option>
                                            {columnHeaders.map(header => (
                                                <option key={header.value} value={header.value}>
                                                    {header.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Option D Column</label>
                                        <select
                                            value={importOptions.optionDColumn}
                                            onChange={(e) => handleOptionChange('optionDColumn', e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Option D Column</option>
                                            {columnHeaders.map(header => (
                                                <option key={header.value} value={header.value}>
                                                    {header.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Option E Column</label>
                                        <select
                                            value={importOptions.optionEColumn}
                                            onChange={(e) => handleOptionChange('optionEColumn', e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Option E Column</option>
                                            {columnHeaders.map(header => (
                                                <option key={header.value} value={header.value}>
                                                    {header.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-4 border-t pt-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Answer Column (optional)</label>
                            <select
                                value={importOptions.answerColumn}
                                onChange={(e) => handleOptionChange('answerColumn', e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select Answer Column</option>
                                {columnHeaders.map(header => (
                                    <option key={header.value} value={header.value}>
                                        {header.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <div className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                id="hasCategory"
                                checked={importOptions.hasCategory}
                                onChange={(e) => handleOptionChange('hasCategory', e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="hasCategory" className="text-sm font-medium">
                                File includes category information
                            </label>
                        </div>

                        {importOptions.hasCategory && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Category Column</label>
                                <select
                                    value={importOptions.categoryColumn}
                                    onChange={(e) => handleOptionChange('categoryColumn', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select Category Column</option>
                                    {columnHeaders.map(header => (
                                        <option key={header.value} value={header.value}>
                                            {header.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 border rounded-md"
                    >
                        Back
                    </button>

                    <button
                        onClick={startImport}
                        disabled={!importOptions.questionColumn || isProcessing}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center"
                    >
                        {isProcessing ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Processing...
                            </>
                        ) : (
                            'Next'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Step 3: Preview Questions
    if (currentStep === 3) {
        const questionPreview = parsedQuestions.slice(0, 10);

        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Review Questions</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Questions Preview:</h3>
                        <div className="text-sm text-gray-600">
                            Showing {questionPreview.length} of {parsedQuestions.length} questions
                        </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                        {questionPreview.map((question, index) => (
                            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                <div className="font-medium mb-2">{question.text}</div>

                                <div className="space-y-1 mt-2 text-sm">
                                    {Object.entries(question.options).map(([letter, text]) => (
                                        text && (
                                            <div key={letter} className={`p-2 rounded ${question.correctAnswer === letter ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
                                                }`}>
                                                <span className="font-bold">{letter}:</span> {text}
                                            </div>
                                        )
                                    ))}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    {question.correctAnswer && (
                                        <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                            Answer: {question.correctAnswer}
                                        </div>
                                    )}

                                    {question.category && (
                                        <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                            {question.category}
                                        </div>
                                    )}

                                    <div className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                                        Part {question.part}
                                    </div>

                                    <div className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                                        {question.year}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-blue-800">Import Summary</h3>
                    <p className="text-blue-600 mb-2">
                        You are about to import {parsedQuestions.length} questions with the following settings:
                    </p>
                    <ul className="list-disc list-inside text-blue-600">
                        <li>PRITE Part: {importOptions.part}</li>
                        <li>PRITE Year: {importOptions.year}</li>
                        <li>Questions will be assigned to your account</li>
                        {importOptions.hasCategory && importOptions.categoryColumn && (
                            <li>Categories will be imported from the file</li>
                        )}
                        {importOptions.answerColumn && (
                            <li>Correct answers will be imported from the file</li>
                        )}
                    </ul>
                </div>

                <div className="flex justify-between">
                    <button
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2 border rounded-md"
                        disabled={isProcessing}
                    >
                        Back
                    </button>

                    <button
                        onClick={saveQuestions}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center"
                    >
                        {isProcessing ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Importing...
                            </>
                        ) : (
                            'Import Questions'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Step 4: Import Complete
    if (currentStep === 4) {
        return (
            <div className="p-4 bg-white rounded-lg shadow text-center">
                <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>

                <h2 className="text-xl font-bold mb-4">Import Complete!</h2>

                <div className="mb-6">
                    <p className="text-lg mb-4">
                        Successfully imported {stats.imported} questions.
                    </p>

                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.imported}</div>
                            <div className="text-sm text-green-600">Imported</div>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                            <div className="text-sm text-red-600">Errors</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => {
                            setFile(null);
                            setFileData([]);
                            setPreview([]);
                            setParsedQuestions([]);
                            setImportOptions({
                                part: '1',
                                year: new Date().getFullYear().toString(),
                                format: 'standard',
                                headerRow: 0,
                                questionColumn: '',
                                optionAColumn: '',
                                optionBColumn: '',
                                optionCColumn: '',
                                optionDColumn: '',
                                optionEColumn: '',
                                answerColumn: '',
                                categoryColumn: '',
                                hasOptions: true,
                                hasCategory: false
                            });
                            setCurrentStep(1);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Import More Questions
                    </button>

                    <button
                        onClick={() => window.location.href = '/browse'}
                        className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md"
                    >
                        View All Questions
                    </button>
                </div>
            </div>
        );
    }

    // Default fallback (shouldn't happen)
    return <div>Loading...</div>;
};

export default BulkImport;