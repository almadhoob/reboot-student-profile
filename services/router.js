// Import the loadView function
import { loadView } from "./app.js";
import authService from "./auth.js";

// Router module for SPA navigation using hash-based routing
export const Router = {
  routes: {
    home: {
      path: "/",
      view: "home",
    },
    login: {
      path: "/login",
      view: "login",
    },
    profile: {
      path: "/profile",
      view: "profile",
      requiresAuth: true,
    },
    stats: {
      path: "/stats",
      view: "stats",
      requiresAuth: true,
    },
    error: {
      path: "/error",
      view: "error",
    },
  },

  navigateTo(routeName) {
    const routeObj = this.routes[routeName];

    if (!routeObj) {
      console.warn(`Route '${routeName}' not found`);
      this.handleNotFound();
      return;
    }

    // For login route - redirect to profile if already authenticated
    if (routeName === "login" && authService.isAuthenticated()) {
      loadView("profile");
      window.location.hash = this.routes.profile.path;
      return;
    }

    // Check authentication for protected routes
    if (routeObj.requiresAuth && !authService.isAuthenticated()) {
      console.log(`Authentication required for route: ${routeName}`);
      // Clear any stale data
      localStorage.removeItem("profileData");
      // Redirect to login if attempting to access protected route without auth
      loadView("login");
      window.location.hash = this.routes.login.path;
      return;
    }

    loadView(routeObj.view);
    window.location.hash = routeObj.path;
  },

  handleNotFound() {
    console.log("Handling 404 - route not found");
    loadView("error");
    window.location.hash = this.routes.error.path;
  },

  handleHashChange() {
    // Get path from hash (remove the # character)
    const path = window.location.hash.slice(1) || "/";
    console.log(`Navigating to path: ${path}`);

    // Find the route that matches this path
    const route = Object.values(this.routes).find(
      (r) => r.path === path || r.path === path + "/"
    );

    if (route) {
      // Special handling for login route - redirect to profile if already authenticated
      if (route.view === "login" && authService.isAuthenticated()) {
        loadView("profile");
        window.location.hash = this.routes.profile.path;
        return;
      }

      // Check authentication for protected routes
      if (route.requiresAuth && !authService.isAuthenticated()) {
        console.log(`Authentication required for ${path}`);
        // Clear any stale data
        localStorage.removeItem("profileData");
        loadView("login");
        window.location.hash = this.routes.login.path;
        return;
      }

      loadView(route.view);
    } else {
      console.log(`No route found for path: ${path}`);
      this.handleNotFound();
    }
  },

  initRouter() {
    // Listen for hash changes instead of popstate
    window.addEventListener("hashchange", () => this.handleHashChange());

    // Handle initial route - if no hash, set the default
    if (!window.location.hash) {
      window.location.hash = "#/";
    } else {
      // Process the current hash
      this.handleHashChange();
    }

    // Add click handler for navigation links
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-route]")) {
        e.preventDefault();
        const routeName = e.target.getAttribute("data-route");
        this.navigateTo(routeName);
      }
    });
  },
};
