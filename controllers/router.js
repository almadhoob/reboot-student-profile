// Import the loadView function
import { loadView } from "./app.js";

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
  },

  navigateTo(route) {
    const routeObj = this.routes[route];

    // Check authentication for protected routes
    if (routeObj.requiresAuth && !localStorage.getItem("authToken")) {
      // Redirect to login if attempting to access protected route without auth
      loadView("login");
      history.pushState(null, null, this.routes.login.path);
      return;
    }

    loadView(routeObj.view);
    history.pushState(null, null, routeObj.path);
  },

  handlePopState() {
    const path = window.location.pathname;
    const route = Object.values(this.routes).find((r) => r.path === path);
    if (route) {
      loadView(route.view);
    }
  },

  initRouter() {
    window.addEventListener("popstate", () => this.handlePopState());

    // Initial route
    const path = window.location.pathname;
    const route =
      Object.values(this.routes).find((r) => r.path === path) ||
      this.routes.home;
    loadView(route.view);
  },
};
