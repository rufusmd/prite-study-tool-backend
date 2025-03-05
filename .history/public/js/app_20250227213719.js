// public/js/app.js
// PRITE categories
const PRITE_CATEGORIES = [
    "Development & Maturation",
    "Behavioral & Social Sciences",
    "Epidemiology",
    "Diagnostic Procedures",
    "Psychopathology & Associated Conditions",
    "Treatment across the Lifespan",
    "Consultation/Collaborative Integrated Care",
    "Issues in Practice",
    "Research & Scholarship Literacy",
    "Administration and Systems"
];

// Application state
const state = {
    questions: [],
    dueQuestions: [],
    currentStudySession: [],
    currentQuestionIndex: 0,
    selectedAnswer: null
};

// DOM Elements - Tabs
const contentTabs = document.querySelectorAll('nav .tab');
const contentSections = document.querySelectorAll('.content');

// DOM Elements - Study
const startBtn = document.getElementById('start-btn');
const showAnswerBtn = document.getElementById('show-answer-btn');
const nextBtn = document.getElementById('next-btn');
const difficultyBtns = document.querySelector('.difficulty-buttons');
const questionText = document.querySelector('.question-text');
const optionsContainer = document.querySelector('.answer-options');
const explanationElem = document.querySelector('.explanation');
const partBadge = document.querySelector('.part-badge');
const categoryBadge = document.querySelector('.category-badge');

// DOM Elements - Add Question
const addQuestionForm = document.getElementById('add-question-form');
const categorySelects = document.querySelectorAll('select[id$="-category"]');

// DOM Elements - Browse
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterPart = document.getElementById('filter-part');
const filterCategory = document.getElementById('filter-category');
const filterVisibility = document.getElementById('filter-visibility');
const questionsList = document.getElementById('questions-list');

// DOM Elements - Stats
const totalQuestionsElem = document.getElementById('total-questions');
const dueQuestionsElem = document.getElementById('due-today');
const masteryPercentageElem = document.getElementById('mastery-percentage');
const accuracyElem = document.getElementById('accuracy');
const progressValueElem = document.querySelector('.progress-value');
const partStatsElem = document.getElementById('part-stats');
const categoryStatsElem = document.getElementById('category-stats');

// Initialize app
async function initApp() {
    // Set up event listeners
    setupTabSwitching();
    setupStudySession();
    setupAddQuestionForm();
    setupSearchAndFilters();

    // Populate category selects
    populateCategoryDropdowns();

    // Load initial data
    await loadData();
}

// Tab switching functionality
function setupTabSwitching() {
    contentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetContent = tab.getAttribute('data-content');

            // Update tab classes
            contentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${targetContent}-content`) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Populate all category dropdowns
function populateCategoryDropdowns() {
    categorySelects.forEach(select => {
        if (select) {
            // Clear existing options
            select.innerHTML = '<option value="">-- Select a category --</option>';

            // Add category options
            PRITE_CATEGORIES.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    });
}

// Load application data
async function loadData() {
    try {
        // Fetch all questions
        const questions = await api.getQuestions();
        state.questions = questions;

        // Fetch questions due for review
        const dueQuestions = await api.getDueQuestions();
        state.dueQuestions = dueQuestions.map(q => q._id);

        // Update UI elements
        updateStats();
        populateQuestionsList();
        showAlert('Data loaded successfully!', 'success');
    } catch (error) {
        showAlert('Failed to load data. Please try again.');
        console.error('Error loading data:', error);
    }
}

// Setup study session functionality
function setupStudySession() {
    if (startBtn) {
        startBtn.addEventListener('click', startStudySession);
    }

    if (showAnswerBtn) {
        showAnswerBtn.addEventListener('click', showAnswer);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }

    // Set up difficulty buttons
    if (difficultyBtns) {
        const buttons = difficultyBtns.querySelectorAll('button');
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const quality = 2 - index; // 2=easy, 1=medium, 0=hard
                updateQuestionDifficulty(quality);
            });
        });
    }
}

// Start a study session
function startStudySession() {
    if (state.dueQuestions.length === 0) {
        showAlert('No questions due for review! Add some questions or check back later.', 'info');
        return;
    }

    // Set up session
    state.currentStudySession = [...state.dueQuestions];
    state.currentQuestionIndex = 0;

    // Randomize order
    state.currentStudySession.sort(() => Math.random() - 0.5);

    // Display first question
    displayQuestion();

    // Update UI
    startBtn.textContent = 'Restart Session';
    showAnswerBtn.disabled = false;
    nextBtn.disabled = true;
}

// Display the current question
function displayQuestion() {
    if (state.currentStudySession.length === 0) return;

    const questionId = state.currentStudySession[state.currentQuestionIndex];
    const question = state.questions.find(q => q._id === questionId);

    if (!question) return;

    // Update question metadata
    partBadge.textContent = `Part ${question.part || '?'}`;
    categoryBadge.textContent = question.category || 'Uncategorized';

    // Set question text
    questionText.textContent = question.text;

    // Create option elements
    optionsContainer.innerHTML = '';

    Object.entries(question.options).forEach(([letter, text]) => {
        if (text) {
            const option = document.createElement('div');
            option.className = 'answer-option';
            option.setAttribute('data-option', letter);
            option.textContent = `${letter}: ${text}`;

            option.addEventListener('click', () => {
                // Clear previous selections
                document.querySelectorAll('.answer-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Mark as selected
                option.classList.add('selected');
                state.selectedAnswer = option;
            });

            optionsContainer.appendChild(option);
        }
    });

    // Set explanation
    explanationElem.textContent = question.explanation || 'No explanation provided.';
    explanationElem.style.display = 'none';

    // Reset UI state
    state.selectedAnswer = null;
    showAnswerBtn.disabled = false;
    nextBtn.disabled = true;
    difficultyBtns.style.display = 'none';
}

// Show the answer for the current question
function showAnswer() {
    if (state.currentStudySession.length === 0) return;

    const questionId = state.currentStudySession[state.currentQuestionIndex];
    const question = state.questions.find(q => q._id === questionId);

    if (!question) return;

    // Mark correct and selected answers
    const options = document.querySelectorAll('.answer-option');
    options.forEach(option => {
        const optionLetter = option.getAttribute('data-option');
        if (optionLetter === question.correctAnswer) {
            option.classList.add('correct');
        } else if (option === state.selectedAnswer) {
            option.classList.add('incorrect');
        }
    });

    // Show explanation
    explanationElem.style.display = 'block';

    // Update UI
    showAnswerBtn.disabled = true;
    difficultyBtns.style.display = 'flex';
    nextBtn.disabled = false;
}

// Move to the next question
function nextQuestion() {
    state.currentQuestionIndex++;

    if (state.currentQuestionIndex < state.currentStudySession.length) {
        displayQuestion();
    } else {
        // End of session
        partBadge.textContent = 'Part ?';
        categoryBadge.textContent = 'Category ?';
        questionText.textContent = 'Session complete! Great job!';
        optionsContainer.innerHTML = '';
        explanationElem.style.display = 'none';

        // Update UI
        showAnswerBtn.disabled = true;
        nextBtn.disabled = true;
        difficultyBtns.style.display = 'none';
        startBtn.textContent = 'Start New Session';

        // Refresh data
        loadData();
    }
}

// Update question difficulty based on user response
async function updateQuestionDifficulty(quality) {
    try {
        const questionId = state.currentStudySession[state.currentQuestionIndex];

        // Send update to the server
        await api.updateStudyData(questionId, quality);

        // Move to next question
        nextQuestion();
    } catch (error) {
        showAlert('Failed to update question difficulty.');
        console.error('Error updating difficulty:', error);
    }
}

// Setup the add question form
function setupAddQuestionForm() {
    if (!addQuestionForm) return;

    addQuestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const questionData = {
            text: document.getElementById('question-text').value,
            options: {
                A: document.getElementById('option-a').value,
                B: document.getElementById('option-b').value,
                C: document.getElementById('option-c').value,
                D: document.getElementById('option-d').value,
                E: document.getElementById('option-e').value
            },
            correctAnswer: document.querySelector('input[name="correct-answer"]:checked')?.value,
            explanation: document.getElementById('question-explanation').value,
            part: document.getElementById('question-part').value,
            category: document.getElementById('question-category').value,
            isPublic: document.getElementById('question-public').checked,
            tags: document.getElementById('question-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
        };

        // Validate
        if (!questionData.text || !questionData.options.A || !questionData.options.B || !questionData.correctAnswer) {
            showAlert('Please fill in the question text, at least options A and B, and select the correct answer.');
            return;
        }

        try {
            // Send to server
            await api.createQuestion(questionData);

            // Reset form
            addQuestionForm.reset();

            // Reload data
            await loadData();

            showAlert('Question added successfully!', 'success');
        } catch (error) {
            showAlert('Failed to add question. Please try again.');
            console.error('Error adding question:', error);
        }
    });
}

// Setup search and filter functionality
function setupSearchAndFilters() {
    if (!searchBtn) return;

    searchBtn.addEventListener('click', async () => {
        const searchParams = {
            text: searchInput.value,
            part: filterPart.value,
            category: filterCategory.value,
            visibility: filterVisibility.value
        };

        try {
            const questions = await api.searchQuestions(searchParams);
            state.questions = questions;
            populateQuestionsList();
        } catch (error) {
            showAlert('Search failed. Please try again.');
            console.error('Error searching questions:', error);
        }
    });
}

// Populate the questions list
function populateQuestionsList() {
    if (!questionsList) return;

    // Clear current list
    questionsList.innerHTML = '';

    if (state.questions.length === 0) {
        questionsList.innerHTML = '<p>No questions found. Try adding some!</p>';
        return;
    }

    // Add each question
    state.questions.forEach(question => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';

        // Check if this question is due for review
        const isDue = state.dueQuestions.includes(question._id);
        if (isDue) {
            questionItem.classList.add('due');
        }

        // Create question item HTML
        questionItem.innerHTML = `
      <div class="question-item-header">
        <div class="question-item-meta">
          <span class="part-badge small">Part ${question.part || '?'}</span>
          <span class="category-badge small">${question.category || 'Uncategorized'}</span>
          ${question.isPublic ? '<span class="public-badge">Public</span>' : ''}
          ${isDue ? '<span class="due-badge">Due</span>' : ''}
        </div>
        <div class="question-item-actions">
          <button class="btn small edit-btn" data-id="${question._id}">Edit</button>
          <button class="btn small danger delete-btn" data-id="${question._id}">Delete</button>
        </div>
      </div>
      <div class="question-item-text">${question.text}</div>
      <div class="question-item-options">
        ${Object.entries(question.options)
                .filter(([_, text]) => text)
                .map(([letter, text]) => `
            <span class="option-text ${letter === question.correctAnswer ? 'correct' : ''}">
              ${letter}: ${text}
            </span>
          `).join('')}
      </div>
    `;

        // Add event listeners for edit/delete buttons
        questionsList.appendChild(questionItem);

        // Edit button
        const editBtn = questionItem.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => editQuestion(question._id));
        }

        // Delete button
        const deleteBtn = questionItem.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteQuestion(question._id));
        }
    });
}

// Edit a question
async function editQuestion(id) {
    const question = state.questions.find(q => q._id === id);
    if (!question) return;

    // We'll implement a modal for editing later
    alert('Edit functionality coming soon!');
}

// Delete a question
async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        await api.deleteQuestion(id);
        showAlert('Question deleted successfully!', 'success');

        // Reload data
        await loadData();
    } catch (error) {
        showAlert('Failed to delete question.');
        console.error('Error deleting question:', error);
    }
}

// Update statistics display
function updateStats() {
    if (!totalQuestionsElem) return;

    // Basic stats
    totalQuestionsElem.textContent = state.questions.length;
    dueQuestionsElem.textContent = state.dueQuestions.length;

    // Calculate mastery percentage
    const masteredQuestions = state.questions.filter(q => {
        const userData = q.studyData?.find(data => data.user === currentUser?.id);
        return userData?.easeFactor > 2.5;
    });

    const masteryPercentage = state.questions.length > 0
        ? Math.round((masteredQuestions.length / state.questions.length) * 100)
        : 0;

    masteryPercentageElem.textContent = `${masteryPercentage}%`;
    progressValueElem.style.width = `${masteryPercentage}%`;

    // Calculate accuracy
    const accuracy = masteredQuestions.length > 0
        ? Math.round((masteredQuestions.length / state.questions.length) * 100)
        : 0;

    accuracyElem.textContent = `${accuracy}%`;

    // Generate part and category stats later
}

// CSS for alerts
const alertStyles = `
  .alert {
    padding: 10px 15px;
    margin-bottom: 15px;
    border-radius: 4px;
    position: relative;
  }
  
  .alert.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .alert.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .alert.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }
  
  .alert .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    background: none;
    border: none;
    font-size: 16px;
  }
`;

// Add alert styles to head
const styleElement = document.createElement('style');
styleElement.textContent = alertStyles;
document.head.appendChild(styleElement);

// Export the init function
window.initApp = initApp;