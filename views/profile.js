import { getStudentProfile } from "../controllers/graphql.js";

export function renderProfileView(container) {
  // Create the profile container if it doesn't exist
  let profileContainer = document.createElement("div");
  profileContainer.id = "profile-container";
  container.innerHTML = ""; // Clear the container
  container.appendChild(profileContainer);

  profileContainer.innerHTML = "<h2>Loading profile data...</h2>";

  // Get user ID from JWT if available
  const token = localStorage.getItem("authToken");
  let userId = null;

  if (token) {
    try {
      // Only attempt to parse if token has JWT format (contains 2 periods)
      if (token.split(".").length === 3) {
        const tokenData = JSON.parse(atob(token.split(".")[1]));
        userId =
          tokenData.user_id ||
          tokenData.sub ||
          (tokenData["https://hasura.io/jwt/claims"] &&
            tokenData["https://hasura.io/jwt/claims"]["x-hasura-user-id"]);
      } else {
        console.warn("Token doesn't have standard JWT format");
      }
    } catch (e) {
      console.error("Error parsing JWT token:", e);
    }
  } else {
    console.warn("No auth token found");
  }

  // For testing, show mock data if no valid token
  if (!token) {
    showMockData(profileContainer);
    return;
  }

  getStudentProfile(userId)
    .then((profileData) => {
      if (!profileData) {
        throw new Error("No profile data received");
      }

      profileContainer.innerHTML = `
        <div class="profile-header">
          <h2>${profileData.name || "Student"}'s Profile</h2>
          <div class="profile-nav">
            <button data-view="home" class="btn">Home</button>
            <button data-view="stats" class="btn">View Statistics</button>
            <button id="logout-btn" class="btn-logout">Logout</button>
          </div>
        </div>
        <div class="profile-content">
          <div class="profile-info">
            <p>ID: ${profileData.id || "N/A"}</p>
            <p>XP: ${profileData.xp || 0}</p>
          </div>
          
          <div class="profile-section">
            <h3>Grades</h3>
            <ul>
              ${
                (profileData.grades || [])
                  .map((grade) => `<li>${grade.subject}: ${grade.score}</li>`)
                  .join("") || "<li>No grades available</li>"
              }
            </ul>
          </div>
          
          <div class="profile-section">
            <h3>Audits</h3>
            <ul>
              ${
                (profileData.audits || [])
                  .map((audit) => `<li>${audit.title}: ${audit.status}</li>`)
                  .join("") || "<li>No audits available</li>"
              }
            </ul>
          </div>
          
          <div class="profile-section">
            <h3>Skills</h3>
            <ul>
              ${
                (profileData.skills || [])
                  .map(
                    (skill) =>
                      `<li>${skill.name}: ${skill.level} (${skill.xp} XP)</li>`
                  )
                  .join("") || "<li>No skills available</li>"
              }
            </ul>
          </div>
        </div>
      `;

      // Add logout handler
      document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      });

      // Store profile data in localStorage for stats page to use
      localStorage.setItem("profileData", JSON.stringify(profileData));
    })
    .catch((error) => {
      console.error("Profile loading error:", error);
      profileContainer.innerHTML = `
        <div class="error-container">
          <h2>Error Loading Profile</h2>
          <p>${error.message}</p>
          <p>This could be due to incorrect API schema or authentication issues.</p>
          <div class="debug-info">
            <details>
              <summary>Debug Information</summary>
              <p>Token exists: ${Boolean(token)}</p>
              <p>User ID: ${userId || "Not found in token"}</p>
            </details>
          </div>
          <button data-view="home">Return Home</button>
        </div>
      `;
    });
}

// Function to show mock data for testing
function showMockData(container) {
  container.innerHTML = `
    <div class="profile-header">
      <h2>Test User's Profile</h2>
      <div class="profile-nav">
        <button data-view="home" class="btn">Home</button>
        <button data-view="stats" class="btn">View Statistics</button>
        <button id="logout-btn" class="btn-logout">Logout</button>
      </div>
    </div>
    <div class="profile-content">
      <div class="profile-info">
        <p>ID: 123</p>
        <p>XP: 42500</p>
      </div>
      
      <div class="profile-section">
        <h3>Grades</h3>
        <ul>
          <li>JavaScript: A</li>
          <li>GraphQL: B+</li>
          <li>HTML/CSS: A-</li>
        </ul>
      </div>
      
      <div class="profile-section">
        <h3>Auth Status</h3>
        <p>No valid JWT token found. Using test data.</p>
      </div>
    </div>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  });
}
