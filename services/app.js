import { Router } from "./router.js";
import authService from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

async function initializeApp() {
  setupEventListeners();

  // Check authentication status on app start
  checkInitialAuthState();

  // Initialize router after auth check
  Router.initRouter();
}

function checkInitialAuthState() {
  // If there's a remembered route and user is authenticated, restore it
  const rememberedView = localStorage.getItem("lastAuthenticatedView");
  if (rememberedView && authService.isAuthenticated()) {
    localStorage.setItem("currentView", rememberedView);
  }
}

function setupEventListeners() {
  document.getElementById("app").addEventListener("click", (e) => {
    if (e.target.matches("[data-view]")) {
      const view = e.target.getAttribute("data-view");
      // Find the corresponding route and navigate to it
      const routeEntry = Object.entries(Router.routes).find(
        ([_, r]) => r.view === view
      );
      if (routeEntry) {
        Router.navigateTo(routeEntry[0]);
      } else {
        loadView(view);
      }
    }
  });
}

export async function loadView(view) {
  localStorage.setItem("currentView", view);

  // Remember last authenticated view for potential restoration
  if (view !== "login" && view !== "home" && authService.isAuthenticated()) {
    localStorage.setItem("lastAuthenticatedView", view);
  }

  const appContainer = document.getElementById("app");

  try {
    // Dynamically import the view module based on the view name
    const viewModule = await import(`../templates/${view}.js`);

    // Check if the module exports the expected render function
    const renderFunctionName = `render${
      view.charAt(0).toUpperCase() + view.slice(1)
    }View`;

    if (viewModule[renderFunctionName]) {
      viewModule[renderFunctionName](appContainer);
    } else if (
      viewModule.default &&
      typeof viewModule.default.render === "function"
    ) {
      // Alternative: check if it exports a default object with a render method
      viewModule.default.render(appContainer);
    } else {
      throw new Error(`No render function found in ${view}.js module`);
    }
  } catch (error) {
    console.error(`Error loading view "${view}":`, error);
    appContainer.innerHTML = `
      <div class="error-container">
        <h2>Error Loading View</h2>
        <p>${error.message}</p>
        <button data-route="home" class="btn btn-primary">Return Home</button>
      </div>
    `;
  }
}
