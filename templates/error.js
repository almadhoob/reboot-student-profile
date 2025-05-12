export function renderErrorView(container) {
  container.innerHTML = `
      <div class="not-found-container">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <button data-route="home" class="btn btn-primary">Return to Home</button>
      </div>
    `;

  container
    .querySelector('button[data-route="home"]')
    .addEventListener("click", (e) => {
      e.preventDefault();
      import("../services/router.js").then((module) => {
        module.Router.navigateTo("home");
      });
    });
}
