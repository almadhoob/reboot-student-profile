export function renderLoginView(container) {
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
        <button type="button" data-view="home" class="cancel-button">Cancel</button>
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
      const token = await authenticateUser(username, password);

      // Store the token directly - the response IS the token
      if (token) {
        localStorage.setItem("authToken", token);

        // Use Router instead of direct import
        try {
          const { Router } = await import("../controllers/router.js");
          Router.navigateTo("profile");
        } catch (routerError) {
          // Fallback to loadView if Router import fails
          const { loadView } = await import("../controllers/app.js");
          loadView("profile");
        }
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      errorMessage.textContent = error.message;
    }
  });
}

async function authenticateUser(username, password) {
  // Base64 encode the username:password for Basic auth
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Auth error:", errorText);
      throw new Error("Authentication failed. Please check your credentials.");
    }

    const responseText = await response.text();

    // Check if the response is a JSON object or just a plain token string
    try {
      // Try to parse as JSON
      return JSON.parse(responseText);
    } catch (e) {
      // If not valid JSON, assume it's the token string directly
      return responseText;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}
