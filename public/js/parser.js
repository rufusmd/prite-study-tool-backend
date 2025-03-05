// public/js/parser.js
let parsedQuestions = [];
let questionsForAnswerKey = [];

// DOM elements - Question Parser
const parseQuestionsTab = document.getElementById('parse-questions-tab');
const processAnswersTab = document.getElementById('process-answers-tab');
const parserTabs = document.querySelectorAll('.parser-tab');
const parserPartSelector = document.getElementById('parser-part-selector');
const ocrInput = document.getElementById('ocr-input');
const parseBtn = document.getElementById('parse-btn');
const clearParserBtn = document.getElementById('clear-parser-btn');
const parserResult = document.getElementById('parser-result');
const parsedQuestionsPreview = document.getElementById('parsed-questions-preview');
const parsedCount = document.getElementById('parsed-count');
const saveParsedBtn = document.getElementById('save-parsed-btn');
const cancelParsedBtn = document.getElementById('cancel-parsed-btn');

// DOM elements - Answer Key Parser
const answersPartSelector = document.getElementById('answers-part-selector');
const answerKeyInput = document.getElementById('answer-key-input');
const questionsToUpdate = document.getElementById('questions-to-update');
const processAnswersBtn = document.getElementById('process-answers-btn');
const clearAnswersBtn = document.getElementById('clear-answers-btn');
const answersResult = document.getElementById('answers-result');
const updatedQuestionsPreview = document.getElementById('updated-questions-preview');
const updatedCount = document.getElementById('updated-count');

// Switch between parser tabs
parserTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-parser-tab');

        // Update tab classes
        parserTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show corresponding content
        document.getElementById('parse-questions-tab').classList.remove('active');
        document.getElementById('process-answers-tab').classList.remove('active');

        if (targetTab === 'questions') {
            document.getElementById('parse-questions-tab').classList.add('active');
        } else if (targetTab === 'answers') {
            document.getElementById('process-answers-tab').classList.add('active');
            loadQuestionsForAnswerKey();
        }
    });
});

// Parse questions
if (parseBtn) {
    parseBtn.addEventListener('click', async () => {
        const ocrText = ocrInput.value.trim();
        const part = parserPartSelector.value;

        if (!ocrText) {
            showAlert('Please paste OCR text first.');
            return;
        }

        try {
            parsedQuestions = await api.parseQuestions(ocrText, part);

            // Show results
            parsedCount.textContent = parsedQuestions.length;
            displayParsedQuestions();
            parserResult.style.display = 'block';

            showAlert(`Successfully parsed ${parsedQuestions.length} questions!`, 'success');
        } catch (error) {
            showAlert('Error parsing questions. Please check the format and try again.');
            console.error('Error parsing questions:', error);
        }
    });
}

// Clear parser form
if (clearParserBtn) {
    clearParserBtn.addEventListener('click', () => {
        ocrInput.value = '';
        parserResult.style.display = 'none';
        parsedQuestions = [];
    });
}

// Save parsed questions
if (saveParsedBtn) {
    saveParsedBtn.addEventListener('click', async () => {
        if (parsedQuestions.length === 0) {
            showAlert('No questions to save.');
            return;
        }

        try {
            const savedQuestions = await api.createBulkQuestions(parsedQuestions);

            showAlert(`Successfully saved ${savedQuestions.length} questions!`, 'success');

            // Reset form
            ocrInput.value = '';
            parserResult.style.display = 'none';
            parsedQuestions = [];

            // Reload data
            await loadData();
        } catch (error) {
            showAlert('Error saving questions. Please try again.');
            console.error('Error saving questions:', error);
        }
    });
}

// Cancel parsed questions
if (cancelParsedBtn) {
    cancelParsedBtn.addEventListener('click', () => {
        parserResult.style.display = 'none';
        parsedQuestions = [];
    });
}

// Display parsed questions preview
function displayParsedQuestions() {
    parsedQuestionsPreview.innerHTML = '';

    if (parsedQuestions.length === 0) {
        parsedQuestionsPreview.innerHTML = '<p>No questions parsed.</p>';
        return;
    }

    // Display first 5 questions
    const previewQuestions = parsedQuestions.slice(0, 5);

    previewQuestions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'preview-item';

        questionDiv.innerHTML = `
      <div class="preview-item-header">
        <span><strong>Question ${question.number}</strong></span>
        <span>Part ${question.part}</span>
      </div>
      <div class="preview-item-text">${question.text}</div>
      <div class="preview-item-options">
        ${Object.entries(question.options)
                .filter(([_, text]) => text)
                .map(([letter, text]) => `
            <div class="option-text">
              ${letter}: ${text}
            </div>
          `).join('')}
      </div>
    `;

        parsedQuestionsPreview.appendChild(questionDiv);
    });

    // If there are more questions, show a message
    if (parsedQuestions.length > 5) {
        const moreDiv = document.createElement('p');
        moreDiv.textContent = `... and ${parsedQuestions.length - 5} more questions`;
        parsedQuestionsPreview.appendChild(moreDiv);
    }
}

// Load questions for answer key processing
async function loadQuestionsForAnswerKey() {
    try {
        // Load all questions that don't have a correct answer yet
        const allQuestions = await api.getQuestions();
        questionsForAnswerKey = allQuestions.filter(q => !q.correctAnswer);

        displayQuestionsForAnswerKey();
    } catch (error) {
        console.error('Error loading questions for answer key:', error);
        questionsToUpdate.innerHTML = '<p>Error loading questions.</p>';
    }
}

// Display questions for answer key processing
function displayQuestionsForAnswerKey() {
    questionsToUpdate.innerHTML = '';

    if (questionsForAnswerKey.length === 0) {
        questionsToUpdate.innerHTML = '<p>No questions found without answers.</p>';
        return;
    }

    // Group questions by part
    const part1Questions = questionsForAnswerKey.filter(q => q.part === '1');
    const part2Questions = questionsForAnswerKey.filter(q => q.part === '2');

    // Create select all checkbox
    const selectAllDiv = document.createElement('div');
    selectAllDiv.className = 'checkbox-list-item';
    selectAllDiv.innerHTML = `
    <input type="checkbox" id="select-all-questions" />
    <label for="select-all-questions"><strong>Select All</strong></label>
  `;
    questionsToUpdate.appendChild(selectAllDiv);

    // Add event listener for select all
    const selectAllCheckbox = document.getElementById('select-all-questions');
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.question-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
    });

    // Add part 1 questions
    if (part1Questions.length > 0) {
        const part1Header = document.createElement('h4');
        part1Header.textContent = 'Part 1 Questions';
        questionsToUpdate.appendChild(part1Header);

        part1Questions.forEach(question => {
            addQuestionCheckbox(question);
        });
    }

    // Add part 2 questions
    if (part2Questions.length > 0) {
        const part2Header = document.createElement('h4');
        part2Header.textContent = 'Part 2 Questions';
        questionsToUpdate.appendChild(part2Header);

        part2Questions.forEach(question => {
            addQuestionCheckbox(question);
        });
    }
}

// Add question checkbox to the list
function addQuestionCheckbox(question) {
    const checkboxItem = document.createElement('div');
    checkboxItem.className = 'checkbox-list-item';
    checkboxItem.innerHTML = `
    <input type="checkbox" class="question-checkbox" data-id="${question._id}" id="q-${question._id}" />
    <label for="q-${question._id}">
      Question ${question.number}: ${question.text.substring(0, 50)}...
    </label>
  `;
    questionsToUpdate.appendChild(checkboxItem);
}

// Process answer key
if (processAnswersBtn) {
    processAnswersBtn.addEventListener('click', async () => {
        const answerKeyText = answerKeyInput.value.trim();
        const part = answersPartSelector.value;

        if (!answerKeyText) {
            showAlert('Please paste answer key text first.');
            return;
        }

        // Get selected question IDs
        const selectedCheckboxes = document.querySelectorAll('.question-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            showAlert('Please select at least one question to update.');
            return;
        }

        const questionIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));

        try {
            const result = await api.parseAnswers(answerKeyText, part, questionIds);

            // Show results
            updatedCount.textContent = result.updated;
            displayUpdatedQuestions(result.questions);
            answersResult.style.display = 'block';

            showAlert(`Successfully updated ${result.updated} questions with answers!`, 'success');

            // Reload data
            await loadData();

            // Reload questions for answer key
            loadQuestionsForAnswerKey();
        } catch (error) {
            showAlert('Error processing answer key. Please try again.');
            console.error('Error processing answer key:', error);
        }
    });
}

// Clear answer key form
if (clearAnswersBtn) {
    clearAnswersBtn.addEventListener('click', () => {
        answerKeyInput.value = '';
        answersResult.style.display = 'none';
    });
}

// Display updated questions
function displayUpdatedQuestions(questions) {
    updatedQuestionsPreview.innerHTML = '';

    if (questions.length === 0) {
        updatedQuestionsPreview.innerHTML = '<p>No questions were updated.</p>';
        return;
    }

    questions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'preview-item';

        questionDiv.innerHTML = `
      <div class="preview-item-header">
        <span><strong>Question ${question.number}</strong></span>
        <span>Part ${question.part}</span>
      </div>
      <div class="preview-item-text">${question.text}</div>
      <div class="preview-item-options">
        ${Object.entries(question.options)
                .filter(([_, text]) => text)
                .map(([letter, text]) => `
            <div class="option-text ${letter === question.correctAnswer ? 'correct' : ''}">
              ${letter}: ${text}
            </div>
          `).join('')}
      </div>
      <div class="preview-item-answer">
        <strong>Correct Answer:</strong> ${question.correctAnswer}
      </div>
    `;

        updatedQuestionsPreview.appendChild(questionDiv);
    });
}

// Initialize when app loads
if (typeof window.initApp === 'function') {
    const originalInitApp = window.initApp;
    window.initApp = async function () {
        await originalInitApp();
        // Load questions for answer key when app initializes
        if (document.getElementById('questions-to-update')) {
            loadQuestionsForAnswerKey();
        }
    };
}