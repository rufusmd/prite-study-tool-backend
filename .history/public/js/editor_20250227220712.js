// public/js/editor.js
const modal = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// Current question being edited
let currentEditQuestion = null;

// Close modal when clicking the X
if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

// Close modal when clicking outside
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });
}

// Open the modal with question editor
function openQuestionEditor(questionId) {
    const question = state.questions.find(q => q._id === questionId);
    if (!question) return;

    currentEditQuestion = question;
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

    // Add event listeners
    document.getElementById('edit-question-form').addEventListener('submit', handleEditFormSubmit);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeModal);
    document.getElementById('delete-question-btn').addEventListener('click', handleDeleteQuestion);
}

// Handle form submission
async function handleEditFormSubmit(e) {
    e.preventDefault();

    if (!currentEditQuestion) return;

    // Gather form data
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

// Handle question deletion
async function handleDeleteQuestion() {
    if (!currentEditQuestion) return;

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

// Close the modal
function closeModal() {
    modal.style.display = 'none';
    currentEditQuestion = null;
}

// Modify the editQuestion function in app.js
window.editQuestion = function (id) {
    openQuestionEditor(id);
};