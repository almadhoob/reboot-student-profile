import { Router } from "./router.js";

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
    Router.navigateTo("login");
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
      authService.logout();
      return false;
    }
  },
};

export default authService;
