// At the beginning of editor.js
// Initialize editor elements
window.editorElements = {
    modal: null,
    modalTitle: null,
    modalBody: null,
    modalClose: null,
    currentEditQuestion: null
};

document.addEventListener('DOMContentLoaded', () => {
    // Update editor elements with actual DOM elements
    window.editorElements = {
        modal: document.getElementById('modal-container'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        modalClose: document.getElementById('modal-close'),
        currentEditQuestion: null
    };

    // Close modal when clicking the X
    const modalClose = window.editorElements.modalClose;
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    const modal = window.editorElements.modal;
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                closeModal();
            }
        });
    }
});

// Then update the openQuestionEditor function
function openQuestionEditor(questionId) {
    const { modal, modalTitle, modalBody } = window.editorElements;

    // Check if modal elements exist
    if (!modal || !modalTitle || !modalBody) {
        console.error('Modal elements not found. Make sure the modal HTML is included in your page.');
        alert('Cannot open editor. Please try again later.');
        return;
    }

    const question = state.questions.find(q => q._id === questionId);
    if (!question) return;

    window.editorElements.currentEditQuestion = question;
    modalTitle.textContent = `Edit Question ${question.number}`;

    // Create the form HTML
    modalBody.innerHTML = `
    <form id="edit-question-form">
      <div class="form-row">
        <div class="form-group">
          <label for="edit-question-part">PRITE Part:</label>
          <select id="edit-question-part">
            <option value="1" ${question.part === "1" ? "selected" : ""}>Part 1</option>
            <option value="2" ${question.part === "2" ? "selected" : ""}>Part 2</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edit-question-category">Category:</label>
          <select id="edit-question-category">
            <option value="">-- Select a category --</option>
            ${PRITE_CATEGORIES.map(cat =>
        `<option value="${cat}" ${question.category === cat ? "selected" : ""}>${cat}</option>`
    ).join('')}
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label for="edit-question-number">Question Number:</label>
        <input type="text" id="edit-question-number" value="${question.number || ''}">
      </div>
      
      <div class="form-group">
        <label for="edit-question-text">Question Text:</label>
        <textarea id="edit-question-text" rows="5">${question.text || ''}</textarea>
      </div>
      
      <div class="options-container">
        <div class="form-group">
          <div class="option-row">
            <input type="radio" name="edit-correct-answer" id="edit-option-a-correct" value="A" ${question.correctAnswer === "A" ? "checked" : ""}>
            <label for="edit-option-a-correct">A:</label>
            <input type="text" id="edit-option-a" value="${question.options.A || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <div class="option-row">
            <input type="radio" name="edit-correct-answer" id="edit-option-b-correct" value="B" ${question.correctAnswer === "B" ? "checked" : ""}>
            <label for="edit-option-b-correct">B:</label>
            <input type="text" id="edit-option-b" value="${question.options.B || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <div class="option-row">
            <input type="radio" name="edit-correct-answer" id="edit-option-c-correct" value="C" ${question.correctAnswer === "C" ? "checked" : ""}>
            <label for="edit-option-c-correct">C:</label>
            <input type="text" id="edit-option-c" value="${question.options.C || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <div class="option-row">
            <input type="radio" name="edit-correct-answer" id="edit-option-d-correct" value="D" ${question.correctAnswer === "D" ? "checked" : ""}>
            <label for="edit-option-d-correct">D:</label>
            <input type="text" id="edit-option-d" value="${question.options.D || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <div class="option-row">
            <input type="radio" name="edit-correct-answer" id="edit-option-e-correct" value="E" ${question.correctAnswer === "E" ? "checked" : ""}>
            <label for="edit-option-e-correct">E:</label>
            <input type="text" id="edit-option-e" value="${question.options.E || ''}">
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="edit-question-explanation">Explanation:</label>
        <textarea id="edit-question-explanation" rows="5">${question.explanation || ''}</textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="edit-question-tags">Tags (comma separated):</label>
          <input type="text" id="edit-question-tags" value="${question.tags ? question.tags.join(', ') : ''}">
        </div>
        
        <div class="form-group checkbox">
          <input type="checkbox" id="edit-question-public" ${question.isPublic ? "checked" : ""}>
          <label for="edit-question-public">Make question public</label>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" id="cancel-edit-btn" class="btn">Cancel</button>
        <button type="button" id="delete-question-btn" class="btn danger">Delete</button>
        <button type="submit" class="btn primary">Save Changes</button>
      </div>
    </form>
  `;

    // Show the modal
    modal.style.display = 'flex';

    // Make sure the event listener is properly attached
    const form = document.getElementById('edit-question-form');
    if (form) {
        // Remove any existing event listeners to prevent duplicates
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Add new event listener
        newForm.addEventListener('submit', handleEditFormSubmit);

        // Add button listeners
        document.getElementById('cancel-edit-btn').addEventListener('click', closeModal);
        document.getElementById('delete-question-btn').addEventListener('click', handleDeleteQuestion);
    }

// Add to your editor.js file
let currentAnswerQuestion = null;

// Open the answer dialog
function openAnswerDialog(questionId) {
    const question = state.questions.find(q => q._id === questionId);
    if (!question) return;

    currentAnswerQuestion = question;

    const answerModal = document.getElementById('answer-modal');
    const answerModalTitle = document.getElementById('answer-modal-title');
    const questionText = document.getElementById('answer-question-text');
    const optionsContainer = document.getElementById('answer-options-container');
    const explanationInput = document.getElementById('answer-explanation');

    // Set title and question text
    answerModalTitle.textContent = `Add Answer to Question ${question.number}`;
    questionText.textContent = question.text;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Add option radio buttons
    Object.entries(question.options).forEach(([letter, text]) => {
        if (!text) return; // Skip empty options

        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option-row';

        optionDiv.innerHTML = `
      <input type="radio" name="correct-answer-option" id="answer-option-${letter}" value="${letter}">
      <label for="answer-option-${letter}" class="answer-option-label">
        <strong>${letter}:</strong> ${text}
      </label>
    `;

        optionsContainer.appendChild(optionDiv);
    });

    // Clear explanation
    explanationInput.value = question.explanation || '';

    // Show the modal
    answerModal.style.display = 'flex';

    // Setup event listeners
    document.getElementById('answer-modal-close').addEventListener('click', closeAnswerDialog);
    document.getElementById('cancel-answer-btn').addEventListener('click', closeAnswerDialog);
    document.getElementById('save-answer-btn').addEventListener('click', saveAnswer);

    // Close dialog when clicking outside
    answerModal.addEventListener('click', (e) => {
        if (e.target === answerModal || e.target.classList.contains('modal-backdrop')) {
            closeAnswerDialog();
        }
    });
}

// Close the answer dialog
function closeAnswerDialog() {
    const answerModal = document.getElementById('answer-modal');
    answerModal.style.display = 'none';
    currentAnswerQuestion = null;
}

// Save the answer
async function saveAnswer() {
    if (!currentAnswerQuestion) return;

    // Get selected answer
    const selectedOption = document.querySelector('input[name="correct-answer-option"]:checked');
    if (!selectedOption) {
        alert('Please select the correct answer option.');
        return;
    }

    const correctAnswer = selectedOption.value;
    const explanation = document.getElementById('answer-explanation').value;

    try {
        // Update question with new answer
        await api.updateQuestion(currentAnswerQuestion._id, {
            correctAnswer,
            explanation
        });

        showAlert('Answer saved successfully!', 'success');

        // Close dialog and refresh data
        closeAnswerDialog();
        await loadData();
    } catch (error) {
        showAlert('Error saving answer. Please try again.');
        console.error('Error saving answer:', error);
    }
}

// Make functions available globally
window.openAnswerDialog = openAnswerDialog;

// Update the handleEditFormSubmit function in editor.js
async function handleEditFormSubmit(e) {
    e.preventDefault();

    // Get the current question from editorElements
    const currentEditQuestion = window.editorElements.currentEditQuestion;

    if (!currentEditQuestion) {
        console.error('No question being edited');
        showAlert('Error: No question found to edit.');
        return;
    }

    // Rest of the function remains the same...
    const updatedQuestion = {
        number: document.getElementById('edit-question-number').value,
        part: document.getElementById('edit-question-part').value,
        category: document.getElementById('edit-question-category').value,
        text: document.getElementById('edit-question-text').value,
        options: {
            A: document.getElementById('edit-option-a').value,
            B: document.getElementById('edit-option-b').value,
            C: document.getElementById('edit-option-c').value,
            D: document.getElementById('edit-option-d').value,
            E: document.getElementById('edit-option-e').value
        },
        correctAnswer: document.querySelector('input[name="edit-correct-answer"]:checked')?.value || '',
        explanation: document.getElementById('edit-question-explanation').value,
        isPublic: document.getElementById('edit-question-public').checked,
        tags: document.getElementById('edit-question-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
    };

    // Validate
    if (!updatedQuestion.text || !updatedQuestion.options.A || !updatedQuestion.options.B) {
        showAlert('Please fill in the question text and at least options A and B.');
        return;
    }

    try {
        // Update on server
        await api.updateQuestion(currentEditQuestion._id, updatedQuestion);

        // Show success
        showAlert('Question updated successfully!', 'success');

        // Close modal and refresh data
        closeModal();
        await loadData();
    } catch (error) {
        showAlert('Error updating question. Please try again.');
        console.error('Error updating question:', error);
    }
}

// Update the handleDeleteQuestion function in editor.js
async function handleDeleteQuestion() {
    // Get the current question from editorElements
    const currentEditQuestion = window.editorElements.currentEditQuestion;

    if (!currentEditQuestion) {
        console.error('No question being edited');
        showAlert('Error: No question found to delete.');
        return;
    }

    if (!confirm(`Are you sure you want to delete Question ${currentEditQuestion.number}? This cannot be undone.`)) {
        return;
    }

    try {
        await api.deleteQuestion(currentEditQuestion._id);

        showAlert('Question deleted successfully!', 'success');

        // Close modal and refresh data
        closeModal();
        await loadData();
    } catch (error) {
        showAlert('Error deleting question. Please try again.');
        console.error('Error deleting question:', error);
    }
}

// Update the closeModal function in editor.js
function closeModal() {
    const modal = window.editorElements.modal;
    if (modal) {
        modal.style.display = 'none';
    }
    window.editorElements.currentEditQuestion = null;
}

// Modify the editQuestion function in app.js
window.editQuestion = function (id) {
    openQuestionEditor(id);
};