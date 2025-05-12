const authService = {
  TOKEN_KEY: "authToken",

  login: async (username, password) => {
    try {
      // Base64 encode the username:password for Basic auth
      const credentials = btoa(`${username}:${password}`);

      const response = await fetch(
        "https://learn.reboot01.com/api/auth/signin",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Auth error:", errorText);
        throw new Error(
          "Authentication failed. Please check your credentials."
        );
      }

      const responseText = await response.text();

      // Check if the response is a JSON object or just a plain token string
      let token;
      try {
        // Try to parse as JSON
        const jsonResponse = JSON.parse(responseText);
        token = jsonResponse.token || jsonResponse;
      } catch (e) {
        // If not valid JSON, assume it's the token string directly
        token = responseText;
      }

      authService.storeToken(token);
      return token;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem(authService.TOKEN_KEY);

    // Get the base path from the current URL
    const basePath = authService.getBasePath();

    // Navigate to login with base path included
    const loginUrl = `${basePath}/login`;
    history.pushState(null, null, loginUrl);

    // Dynamically import to avoid circular dependencies
    import("./app.js").then((module) => {
      module.loadView("login");
    });
  },

  // Helper function to determine the base path
  getBasePath: () => {
    const path = window.location.pathname;
    // Look for the application path in the URL
    const pathParts = path.split("/");
    // Check for both possible subdirectory names
    if (pathParts.length > 1) {
      if (pathParts[1] === "reboot-student-profile")
        return "/reboot-student-profile";
    }
    return "";
  },

  storeToken: (token) => {
    localStorage.setItem(authService.TOKEN_KEY, token);
  },

  getToken: () => {
    return localStorage.getItem(authService.TOKEN_KEY);
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    if (!token) return false;

    // Basic validation - check if token is not expired
    // If you have JWT, you could decode and check expiration
    try {
      // If your token is JWT, you could decode and validate it
      // For now, we just check if it exists
      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      // If validation fails, clear the invalid token
      localStorage.removeItem(authService.TOKEN_KEY);
      return false;
    }
  },
};

export default authService;
