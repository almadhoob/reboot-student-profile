const authService = (() => {
  const TOKEN_KEY = "jwt_token";

  const login = async (username, password) => {
    const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    storeToken(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
  };

  const storeToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  };

  const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  const isAuthenticated = () => {
    return getToken() !== null;
  };

  return {
    login,
    logout,
    getToken,
    isAuthenticated,
  };
})();
