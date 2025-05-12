// Import the loadView function
import { loadView } from "./app.js";
import authService from "./auth.js";

// Dynamically determine base path for subdirectory support
const getBasePath = () => {
  const path = window.location.pathname;
  // Look for the application path in the URL
  const pathParts = path.split("/");
  // Check for both possible subdirectory names
  if (pathParts.length > 1) {
    if (pathParts[1] === "reboot-student-profile")
      return "/reboot-student-profile";
  }
  return "";
};

const BASE_PATH = getBasePath();

// Helper to add base path to routes
function withBase(path) {
  return BASE_PATH + (path.startsWith("/") ? path : "/" + path);
}

// Helper to remove base path from current URL
function stripBase(path) {
  return path.startsWith(BASE_PATH)
    ? path.slice(BASE_PATH.length) || "/"
    : path;
}

// Router module for SPA navigation
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
      this.handleNotFound();
      return;
    }

    // For login route - redirect to profile if already authenticated
    if (routeName === "login" && authService.isAuthenticated()) {
      loadView("profile");
      history.pushState(null, null, withBase(this.routes.profile.path));
      return;
    }

    // Check authentication for protected routes
    if (routeObj.requiresAuth && !authService.isAuthenticated()) {
      // Redirect to login if attempting to access protected route without auth
      loadView("login");
      history.pushState(null, null, withBase(this.routes.login.path));
      return;
    }

    loadView(routeObj.view);
    history.pushState(null, null, withBase(routeObj.path));
  },

  handleNotFound() {
    loadView("error");
    history.pushState(null, null, withBase(this.routes.error.path));
  },

  handlePathChange(path) {
    // Remove the base path to get the app-specific path
    const appPath = stripBase(path);

    // Normalize path (remove trailing slash except for root path)
    const normalizedPath = appPath === "/" ? "/" : appPath.replace(/\/$/, "");

    // Find the route that matches this path
    const route = Object.values(this.routes).find(
      (r) => r.path === normalizedPath
    );

    if (route) {
      // Special handling for login route - redirect to profile if already authenticated
      if (route.view === "login" && authService.isAuthenticated()) {
        loadView("profile");
        history.pushState(null, null, withBase(this.routes.profile.path));
        return;
      }

      // Check authentication for protected routes
      if (route.requiresAuth && !authService.isAuthenticated()) {
        console.log("Authentication required for", normalizedPath);
        loadView("login");
        history.pushState(null, null, withBase(this.routes.login.path));
        return;
      }

      loadView(route.view);
    } else {
      this.handleNotFound();
    }
  },

  handlePopState() {
    this.handlePathChange(window.location.pathname);
  },

  initRouter() {
    window.addEventListener("popstate", () => this.handlePopState());

    // Handle initial route
    this.handlePathChange(window.location.pathname);

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
