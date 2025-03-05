// public/js/auth.js
// DOM Elements
const authContainer = document.getElementById('auth-container');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form-element');
const registerForm = document.getElementById('register-form-element');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const authTabs = document.querySelectorAll('.tabs .tab');
const authForms = document.querySelectorAll('.auth-form');
const alertContainer = document.getElementById('alert-container');

// Current user state
let currentUser = null;

// Show an alert message
function showAlert(message, type = 'error') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => alertContainer.removeChild(alert));
    alert.appendChild(closeBtn);

    // Add to container
    alertContainer.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertContainer.contains(alert)) {
            alertContainer.removeChild(alert);
        }
    }, 5000);
}

// Switch between login and register forms
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');

        // Update tab classes
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show corresponding form
        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${targetTab}-form`) {
                form.classList.add('active');
            }
        });
    });
});

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await api.login(username, password);

            // Save token and user data
            api.setToken(data.token);
            currentUser = data.user;

            // Show success message
            showAlert('Login successful!', 'success');

            // Show main application
            showMainApp();
        } catch (error) {
            showAlert(error.message || 'Login failed. Please check your credentials.');
        }
    });
}

// Handle register form submission
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const data = await api.register(username, email, password);

            // Save token and user data
            api.setToken(data.token);
            currentUser = data.user;

            // Show success message
            showAlert('Registration successful!', 'success');

            // Show main application
            showMainApp();
        } catch (error) {
            showAlert(error.message || 'Registration failed. Please try again.');
        }
    });
}

// Handle logout button click
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        api.clearToken();
        currentUser = null;
        showAuthForms();
        showAlert('Logged out successfully.', 'success');
    });
}

// Display main app, hide auth forms
function showMainApp() {
    if (!currentUser) return;

    // Update user display
    userDisplay.textContent = currentUser.username;

    // Toggle visibility
    authContainer.style.display = 'none';
    mainApp.style.display = 'block';

    // Initialize the application
    if (typeof initApp === 'function') {
        initApp();
    }
}

// Display auth forms, hide main app
function showAuthForms() {
    // Toggle visibility
    mainApp.style.display = 'none';
    authContainer.style.display = 'block';

    // Clear form fields
    if (document.getElementById('login-username')) {
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    }

    if (document.getElementById('register-username')) {
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
    }
}

// Check auth status on page load
async function checkAuthStatus() {
    const token = localStorage.getItem('token');

    if (token) {
        api.setToken(token);

        try {
            currentUser = await api.getCurrentUser();
            showMainApp();
        } catch (error) {
            // Token invalid or expired
            api.clearToken();
            showAuthForms();
        }
    } else {
        showAuthForms();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', checkAuthStatus);