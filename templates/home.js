export function renderHomeView(container) {
  container.innerHTML = `
    <div class="home">
      <h1>Welcome to the Student Profile SPA</h1>
      <p>Your one-stop page for showing your student profile, grades, and achievements.</p>
      <button data-view="login">Login</button>
    </div>
  `;
}
