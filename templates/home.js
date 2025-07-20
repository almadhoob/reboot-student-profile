export function renderHomeView(container) {
  container.innerHTML = `
    <div class="home">
      <div class="home-container">
        <svg class="home-hero-icon" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea"/>
              <stop offset="100%" style="stop-color:#764ba2"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#iconGradient)" fill-opacity="0.2"/>
          <path d="M32 12L56 26L32 40L8 26L32 12Z" fill="url(#iconGradient)" fill-opacity="0.8"/>
          <path d="M32 44V52" stroke="url(#iconGradient)" stroke-width="3" stroke-linecap="round"/>
          <circle cx="32" cy="32" r="8" fill="#667eea" stroke="#fff" stroke-width="2"/>
        </svg>
        
        <h1>Reboot Student Portal</h1>
        <p class="home-subtitle">
          Unlock your academic potential with our modern student dashboard. 
          Track your progress, visualize your achievements, and stay motivated on your coding journey.
        </p>
        
        <div class="home-cta">
          <button class="btn-primary" data-route="login">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Get Started
          </button>
        </div>

        <div class="home-features">
          <div class="feature-card">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <h3 class="feature-title">Progress Tracking</h3>
            <p class="feature-desc">Monitor your XP growth and level progression in real-time</p>
          </div>
          
          <div class="feature-card">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
            <h3 class="feature-title">Grade Analytics</h3>
            <p class="feature-desc">Visualize your academic performance with interactive charts</p>
          </div>
          
          <div class="feature-card">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3 class="feature-title">Peer Reviews</h3>
            <p class="feature-desc">Track your audit performance and peer evaluation history</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const buttons = container.querySelectorAll("[data-route]");
  buttons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const route = button.getAttribute("data-route");
      if (route && route !== "home") {
        import("../services/router.js").then((module) => {
          module.Router.navigateTo(route);
        });
      }
    });
  });
}
