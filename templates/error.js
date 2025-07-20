export function renderErrorView(container) {
  container.innerHTML = `
    <div class="error-container">
      <div class="error-card">
        <svg class="error-icon" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea"/>
              <stop offset="100%" style="stop-color:#764ba2"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" stroke="url(#errorGradient)" stroke-width="4" fill="none"/>
          <circle cx="32" cy="32" r="20" fill="url(#errorGradient)" fill-opacity="0.1"/>
          <text x="32" y="38" text-anchor="middle" fill="url(#errorGradient)" font-size="20" font-weight="bold">404</text>
        </svg>
        
        <h1 class="error-title">404</h1>
        <h2 class="error-subtitle">Page Not Found</h2>
        <p class="error-description">
          Oops! The page you're looking for seems to have vanished into the digital void. 
          It might have been moved, deleted, or perhaps it never existed in the first place.
        </p>
        
        <div class="error-actions">
          <button class="btn-primary" data-route="home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Back to Home
          </button>
          
          <button class="btn-secondary" onclick="history.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  `;

  const homeButton = container.querySelector('[data-route="home"]');
  if (homeButton) {
    homeButton.addEventListener("click", (e) => {
      e.preventDefault();
      import("../services/router.js").then((module) => {
        module.Router.navigateTo("home");
      });
    });
  }
}
