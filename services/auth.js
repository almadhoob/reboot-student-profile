import { Router } from "./router.js";

const authService = {
  TOKEN_KEY: "authToken",

  login: async (username, password) => {
    try {
      // Validate input
      if (!username || !password) {
        throw new Error("Username and password are required");
      }

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
        console.error("Auth error:", response.status, errorText);

        // Provide specific error messages based on status code
        if (response.status === 401) {
          throw new Error(
            "Invalid username or password. Please check your credentials."
          );
        } else if (response.status === 403) {
          throw new Error("Access forbidden. Please contact support.");
        } else if (response.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(
            `Authentication failed (${response.status}). Please try again.`
          );
        }
      }

      const responseText = await response.text();

      // Check if the response is a JSON object or just a plain token string
      let token;
      try {
        // Try to parse as JSON
        const jsonResponse = JSON.parse(responseText);
        token = jsonResponse.token || jsonResponse.access_token || jsonResponse;
      } catch (e) {
        // If not valid JSON, assume it's the token string directly
        token = responseText.trim();
      }

      if (!token) {
        throw new Error("No authentication token received from server");
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
    localStorage.removeItem("profileData");
    localStorage.removeItem("lastAuthenticatedView");
    localStorage.removeItem("currentView");
    // Use hash-based navigation instead of history API
    Router.navigateTo("login");
  },

  storeToken: (token) => {
    if (!token) {
      throw new Error("Cannot store empty token");
    }
    localStorage.setItem(authService.TOKEN_KEY, token);
  },

  getToken: () => {
    return localStorage.getItem(authService.TOKEN_KEY);
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    if (!token) return false;

    try {
      // If your token is JWT, validate it
      if (token.split(".").length === 3) {
        const payload = JSON.parse(atob(token.split(".")[1]));

        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log("Token has expired");
          localStorage.removeItem(authService.TOKEN_KEY);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      // If validation fails, clear the invalid token
      localStorage.removeItem(authService.TOKEN_KEY);
      return false;
    }
  },

  // Get user info from token
  getUserInfo: () => {
    const token = authService.getToken();
    if (!token) return null;

    try {
      if (token.split(".").length === 3) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
          userId:
            payload.user_id ||
            payload.sub ||
            (payload["https://hasura.io/jwt/claims"] &&
              payload["https://hasura.io/jwt/claims"]["x-hasura-user-id"]),
          username: payload.username || payload.preferred_username,
          exp: payload.exp,
        };
      }
    } catch (error) {
      console.error("Error extracting user info from token:", error);
    }

    return null;
  },
};

export default authService;
