// public/js/auth.js
// Authentication handling

// DOM Elements
const authContainer = document.getElementById('auth-container');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form-element');
const registerForm = document.getElementById('register-form-element');
const logoutBtn = document.getElementById('logout-btn');
const authTabs = document.querySelectorAll('#login-register-container .tab');
const authForms = document.querySelectorAll('.auth-form');
const userDisplay = document.getElementById('user-display');

// Toggle between login and register forms
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetForm = tab.getAttribute('data-tab');

        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show the selected form
        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${targetForm}-form`) {
                form.classList.add('active');
            }
        });
    });
});

// Handle login form submission
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const userData = await api.login(username, password);
        onLoginSuccess(userData.user);
    } catch (error) {
        alert(error.message || 'Login failed. Please check your credentials.');
    }
});

// Handle register form submission
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const userData = await api.register(username, email, password);
        onLoginSuccess(userData.user);
    } catch (error) {
        alert(error.message || 'Registration failed. Please try again.');
    }
});

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        api.clearToken();
        showAuthForms();
    });
}

// Show the main app on successful login
function onLoginSuccess(user) {
    // Display username
    userDisplay.textContent = user.username;

    // Hide auth forms, show main app
    authContainer.style.display = 'none';
    mainApp.style.display = 'block';

    // Load initial data
    loadUserData();
}

// Show authentication forms
function showAuthForms() {
    // Hide main app, show auth forms
    mainApp.style.display = 'none';
    authContainer.style.display = 'block';

    // Clear form fields
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

// Check if user is already logged in on page load
async function checkAuthStatus() {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const user = await api.getCurrentUser();
            onLoginSuccess(user);
        } catch (error) {
            // Token might be invalid or expired
            api.clearToken();
            showAuthForms();
        }
    } else {
        showAuthForms();
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', checkAuthStatus);