import authService from "../services/auth.js";
import { Router } from "../services/router.js";

export function renderLoginView(container) {
  if (authService.isAuthenticated()) {
    Router.navigateTo("profile");
    return;
  }

  container.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <svg class="login-icon" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="loginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea"/>
                <stop offset="100%" style="stop-color:#764ba2"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#loginGradient)" fill-opacity="0.2"/>
            <path d="M32 16a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill="url(#loginGradient)"/>
            <path d="M32 40c-8.837 0-16 7.163-16 16h32c0-8.837-7.163-16-16-16z" fill="url(#loginGradient)" fill-opacity="0.8"/>
            <circle cx="32" cy="32" r="30" stroke="url(#loginGradient)" stroke-width="2" fill="none"/>
          </svg>
          <h2 class="login-title">Welcome Back</h2>
          <p class="login-subtitle">Sign in to your Reboot01 account</p>
        </div>

        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Username or Email
            </label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              class="form-input"
              placeholder="Enter your username or email"
              required 
              autocomplete="username"
            >
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input"
              placeholder="Enter your password"
              required 
              autocomplete="current-password"
            >
          </div>

          <div id="error-message" class="error-message"></div>

          <div class="form-actions">
            <button type="submit" class="btn-primary login-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
            </button>
            
            <button type="button" class="btn-secondary" id="cancel-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");
  const cancelButton = document.getElementById("cancel-button");
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: rotate 1s linear infinite;">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      Signing in...
    `;

    try {
      await authService.login(username, password);
      Router.navigateTo("profile");
    } catch (error) {
      errorMessage.textContent =
        error.message || "Login failed. Please try again.";

      submitButton.disabled = false;
      submitButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign In
      `;
    }
  });

  cancelButton.addEventListener("click", () => {
    Router.navigateTo("home");
  });

  const style = document.createElement("style");
  style.textContent = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
