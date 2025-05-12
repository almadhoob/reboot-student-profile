import authService from "../services/auth.js";
import { Router } from "../services/router.js";

export function renderLoginView(container) {
  // Check if user is already logged in - redirect to profile if they are
  if (authService.isAuthenticated()) {
    Router.navigateTo("profile");
    return; // Stop further rendering to prevent flicker
  }

  // Create the login form HTML
  container.innerHTML = `
    <div class="login-container">
      <h2>Login to Reboot01</h2>
      <form id="login-form" class="login-form">
        <div class="form-group">
          <label for="username">Username or Email</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>
        <div id="error-message" class="error-message"></div>
        <button type="submit" class="login-button">Login</button>
        <button type="button" data-route="home" class="cancel-button">Cancel</button>
      </form>
    </div>
  `;

  // Now that the form exists in the DOM, we can access it
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");

  // Add event listener to the form
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      // Use the auth service to handle login
      await authService.login(username, password);

      // If login is successful, redirect to profile
      Router.navigateTo("profile");
    } catch (error) {
      errorMessage.textContent = error.message;
    }
  });
}
