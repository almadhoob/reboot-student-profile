export function renderHomeView(container) {
  container.innerHTML = `
    <div class="home">
      <svg class="home-hero-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" fill="#fff" fill-opacity="0.12"/>
        <path d="M32 12L56 26L32 40L8 26L32 12Z" fill="#fff" fill-opacity="0.22"/>
        <path d="M32 44V52" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="8" fill="#e8491d" stroke="#fff" stroke-width="2"/>
      </svg>
      <h1>Reboot Student Profile</h1>
      <p>
        Discover your academic journey in style.<br>
        Ready to get started?
      </p>
      <button data-view="login" class="button">Login</button>
    </div>
  `;
}
