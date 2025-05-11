document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

async function initializeApp() {
  setupEventListeners();
  await loadInitialView();
}

function setupEventListeners() {
  document.getElementById("app").addEventListener("click", (e) => {
    if (e.target.matches("[data-view]")) {
      const view = e.target.getAttribute("data-view");
      loadView(view);
    }
  });
}

function loadInitialView() {
  const isAuthenticated = localStorage.getItem("authToken");
  const initialView = isAuthenticated
    ? localStorage.getItem("currentView") || "home"
    : "home";

  loadView(initialView);
}

export async function loadView(view) {
  localStorage.setItem("currentView", view);
  const appContainer = document.getElementById("app");

  try {
    // Dynamically import the view module based on the view name
    const viewModule = await import(`../views/${view}.js`);

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
        <button data-view="home">Return Home</button>
      </div>
    `;
  }
}
