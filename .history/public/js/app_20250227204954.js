// public/js/app.js
// Main application logic

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
const questionDisplay = document.querySelector('.question-text');
const optionsContainer = document.querySelector('.answer-options');
const explanationElem = document.querySelector('.explanation');
const partBadge = document.querySelector('.part-badge');
const categoryBadge = document.querySelector('.category-badge');

// DOM Elements - Add Question
const addQuestionForm = document.getElementById('add-question-form');
const questionCategorySelect = document.getElementById('question-category');

// DOM Elements - Stats
const totalQuestionsElem = document.getElementById('total-questions');
const dueQuestionsElem = document.getElementById('due-today');
const masteryPercentageElem = document.getElementById('mastery-percentage');
const accuracyElem = document.getElementById('accuracy');
const progressValueElem = document.querySelector('.progress-value');
const partStatsElem = document.getElementById('part-stats');
const categoryStatsElem = document.getElementById('category-stats');

// Tab switching functionality
contentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetContent = tab.getAttribute('data-content');

        // Update active tab
        contentTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show the selected content
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${targetContent}-content`) {
                section.classList.add('active');
            }
        });
    });
});

// Load user data on login
async function loadUserData() {
    try {
        // Populate category dropdowns
        populateCategoryDropdowns();

        // Load questions
        const questions = await api.getUserQuestions();
        state.questions = questions;

        // Load due questions
        const dueQuestions = await api.getDueQuestions();
        state.dueQuestions = dueQuestions;

        // Update statistics
        updateStatistics();
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Failed to load your data. Please try again later.');
    }
}

// Populate category dropdowns
function populateCategoryDropdowns() {
    const categorySelects = [
        document.getElementById('question-category'),
        document.getElementById('filter-category')
    ];

    categorySelects.forEach(select => {
        if (select) {
            // Clear existing options except the default one
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

// Study functionality
if (startBtn) {
    startBtn.addEventListener('click', startStudySession);
}

if (showAnswerBtn) {
    showAnswerBtn.addEventListener('click', showAnswer);
}

if (nextBtn) {
    nextBtn.addEventListener('click', showNextQuestion);
}

// Start a study session
function startStudySession() {
    if (state.dueQuestions.length === 0) {
        alert('No questions due for review! Add questions or check back later.');
        return;
    }

    // Set up current study session
    state.currentStudySession = [...state.dueQuestions];
    // Randomize order
    state.currentStudySession.sort(() => Math.random() - 0.5);
    state.currentQuestionIndex = 0;

    // Display first question
    displayCurrentQuestion();

    // Update button states
    startBtn.textContent = 'Restart Session';
    showAnswerBtn.disabled = false;
    nextBtn.disabled = true;
}

// Display the current question
function displayCurrentQuestion() {
    if (state.currentStudySession.length === 0) return;

    const questionId = state.currentStudySession[state.currentQuestionIndex];
    const question = state.questions.find(q => q._id === questionId);

    if (!question) return;

    // Update question metadata
    partBadge.textContent = `Part ${question.part || '?'}`;
    categoryBadge.textContent = question.category || 'Uncategorized';

    // Set question text
    questionDisplay.textContent = question.text;

    // Create option elements
    optionsContainer.innerHTML = '';

    Object.entries(question.options).forEach(([letter, text]) => {
        if (text) {
            const optionElem = document.createElement('div');
            optionElem.className = 'answer-option';
            optionElem.setAttribute('data-option', letter);
            optionElem.textContent = `${letter}: ${text}`;

            optionElem.addEventListener('click', () => {
                // Clear previous selections
                document.querySelectorAll('.answer-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Mark this option as selected
                optionElem.classList.add('selected');
                state.selectedAnswer = optionElem;
            });

            optionsContainer.appendChild(optionElem);
        }
    });

    // Set explanation text (hidden initially)
    explanationElem.textContent = question.explanation || 'No explanation provided.';
    explanationElem.style.display = 'none';

    // Reset buttons
    state.selectedAnswer = null;
    showAnswerBtn.disabled = false;
    nextBtn.disabled = true;
    difficultyBtns.style.display = 'none';
}

// Show the answer
function showAnswer() {
    if (state.currentStudySession.length === 0) return;

    const questionId = state.currentStudySession[state.currentQuestionIndex];
    const question = state.questions.find(q => q._id === questionId);

    if (!question) return;

    // Mark the correct answer
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

    // Show difficulty buttons and disable answer button
    difficultyBtns.style.display = 'flex';
    showAnswerBtn.disabled = true;
    nextBtn.disabled = false;

    // Set up difficulty buttons
    const difficultyButtons = difficultyBtns.querySelectorAll('button');
    difficultyButtons.forEach((btn, index) => {
        // Remove previous event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // Add new event listener
        newBtn.addEventListener('click', async () => {
            const quality = 2 - index; // 2=easy, 1=medium, 0=hard

            try {
                // Update study data on the server
                await api.updateStudyData(questionId, quality);

                // Move to next question
                showNextQuestion();
            } catch (error) {
                console.error('Error updating study data:', error);
                alert('Failed to save your progress. Please try again.');
            }
        });
    });
}

// Show the next question
function showNextQuestion() {
    state.currentQuestionIndex++;

    if (state.currentQuestionIndex < state.currentStudySession.length) {
        // Display next question
        displayCurrentQuestion();
    } else {
        // End of session
        partBadge.textContent = 'Part ?';
        categoryBadge.textContent = 'Category ?';
        questionDisplay.textContent = 'Session complete! Great job!';
        optionsContainer.innerHTML = '';
        explanationElem.style.display = 'none';

        // Update buttons
        showAnswerBtn.disabled = true;
        nextBtn.disabled = true;
        difficultyBtns.style.display = 'none';
        startBtn.textContent = 'Start New Session';

        // Refresh due questions
        loadUserData();
    }
}

// Add Question form submission
if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get form values
        const part = document.getElementById('question-part').value;
        const category = document.getElementById('question-category').value;
        const text = document.getElementById('question-text').value;

        const options = {
            A: document.getElementById('option-a').value,
            B: document.getElementById('option-b').value,
            C: document.getElementById('option-c').value,
            D: document.getElementById('option-d').value,
            E: document.getElementById('option-e').value
        };

        const correctAnswer = document.querySelector('input[name="correct-answer"]:checked')?.value;
        const explanation = document.getElementById('question-explanation').value;
        const tagsInput = document.getElementById('question-tags').value;
        const isPublic = document.getElementById('question-public').checked;

        // Validate
        if (!text || !options.A || !options.B || !correctAnswer) {
            alert('Please enter question text, at least options A and B, and select the correct answer.');
            return;
        }

        // Process tags
        const tags = tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        // Prepare question data
        const questionData = {
            text,
            options,
            correctAnswer,
            explanation,
            part,
            category,
            isPublic,
            tags
        };

        try {
            // Send to API
            await api.createQuestion(questionData);

            // Clear form
            addQuestionForm.reset();

            // Show success message
            alert('Question added successfully!');

            // Reload user data
            await loadUserData();
        } catch (error) {
            console.error('Error adding question:', error);
            alert('Failed to add question. Please try again.');
        }
    });
}

// Update statistics display
function updateStatistics() {
    if (!totalQuestionsElem) return;

    // Basic stats
    totalQuestionsElem.textContent = state.questions.length;
    dueQuestionsElem.textContent = state.dueQuestions.length;

    // Calculate mastery percentage (based on study data)
    let totalMastery = 0;
    let masteredCount = 0;

    state.questions.forEach(question => {
        const userData = question.studyData.find(
            data => data.user === currentUser.id
        );

        if (userData && userData.easeFactor) {
            totalMastery += userData.easeFactor;

            if (userData.easeFactor > 2.5) {
                masteredCount++;
            }
        }
    });

    const averageEaseFactor = state.questions.length > 0 ?
        totalMastery / state.questions.length : 0;

    // Map average ease factor (1.3 to 2.5+) to percentage (0% to 100%)
    const masteryPercentage = Math.min(
        100,
        Math.max(0, Math.round((averageEaseFactor - 1.3) / 1.2 * 100))
    );

    masteryPercentageElem.textContent = `${masteryPercentage}%`;
    progressValueElem.style.width = `${masteryPercentage}%`;

    // Calculate accuracy
    const accuracy = state.questions.length > 0 ?
        Math.round((masteredCount / state.questions.length) * 100) : 0;

    accuracyElem.textContent = `${accuracy}%`;

    // Update part and category stats (implementation omitted for brevity)
    // This would analyze questions by part and category and update the stats display
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check auth status first (defined in auth.js)
    // This will call loadUserData() upon successful login
});