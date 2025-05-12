import { getStudentProfile } from "../services/graphql.js";

export function renderProfileView(container) {
  // Create the profile container if it doesn't exist
  let profileContainer = document.createElement("div");
  profileContainer.id = "profile-container";
  container.innerHTML = ""; // Clear the container
  container.appendChild(profileContainer);

  profileContainer.innerHTML = `
    <div class="profile-header">
      <h2>Loading profile data...</h2>
    </div>
  `;

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
          <h2>
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none" style="vertical-align:middle;margin-right:8px;">
              <circle cx="32" cy="32" r="30" fill="#fff" fill-opacity="0.12"/>
              <path d="M32 12L56 26L32 40L8 26L32 12Z" fill="#fff" fill-opacity="0.22"/>
              <path d="M32 44V52" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
              <circle cx="32" cy="32" r="8" fill="#e8491d" stroke="#fff" stroke-width="2"/>
            </svg>
            ${profileData.name || "Student"}'s Profile
          </h2>
          <div class="profile-nav">
            <button data-view="stats" class="btn">View Statistics</button>
            <button id="logout-btn" class="btn-logout">Logout</button>
          </div>
        </div>
        <div class="profile-content">
          <div class="profile-info">
            <p><strong>ID:</strong> ${profileData.id || "N/A"}</p>
            <p><strong>Login:</strong> ${profileData.login || "N/A"}</p>
            <p><strong>XP:</strong> ${Number(
              profileData.xp-1000000 || 0
            ).toLocaleString()}</p>
            <p><strong>Level:</strong> ${profileData.level || 0}</p>
          </div>
          
          <div class="profile-section">
            <h3>Recent Grades (${(profileData.grades || []).length})</h3>
            <ul>
              ${
                (profileData.grades || [])
                  .slice(0, 10)
                  .map(
                    (grade) =>
                      `<li><strong>${grade.subject}:</strong> ${grade.score} (${grade.status}) - ${grade.date}</li>`
                  )
                  .join("") || "<li>No grades available</li>"
              }
            </ul>
          </div>
          
          <div class="profile-section">
            <h3>Recent Audits (${(profileData.audits || []).length})</h3>
            <ul>
              ${
                (profileData.audits || [])
                  .slice(0, 10)
                  .map(
                    (audit) =>
                      `<li><strong>${audit.title}:</strong> ${audit.status} (${audit.grade}) by ${audit.evaluator} - ${audit.date}</li>`
                  )
                  .join("") || "<li>No audits available</li>"
              }
            </ul>
          </div>

          <div class="profile-section">
            <h3>Statistics Summary</h3>
            <ul>
              <li><strong>Total Projects:</strong> ${
                profileData.stats?.totalProjects || 0
              }</li>
              <li><strong>Passed Projects:</strong> ${
                profileData.stats?.passedProjects || 0
              }</li>
              <li><strong>Success Rate:</strong> ${
                profileData.stats?.successRate || 0
              }%</li>
              <li><strong>Audit Ratio:</strong> ${
                profileData.stats?.auditRatio || 0
              }%</li>
            </ul>
          </div>
          
        </div>
      `;

      // Add logout handler - check if element exists first
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("profileData");
          import("../services/router.js").then((module) => {
            module.Router.navigateTo("login");
          });
        });
      }

      // Store profile data in localStorage for stats page to use
      localStorage.setItem("profileData", JSON.stringify(profileData));
    })
    .catch((error) => {
      console.error("Profile loading error:", error);
      profileContainer.innerHTML = `
        <div class="error-container">
          <h2>Error Loading Profile</h2>
          <p>${error.message}</p>
          <p>This could be due to incorrect API schema, authentication issues, or network problems.</p>
          <div class="debug-info">
            <details>
              <summary>Debug Information</summary>
              <p><strong>Token exists:</strong> ${Boolean(token)}</p>
              <p><strong>User ID:</strong> ${userId || "Not found in token"}</p>
              <p><strong>Error details:</strong> ${
                error.stack || error.message
              }</p>
            </details>
          </div>
          <button data-route="home" class="btn">Return Home</button>
          <button data-route="login" class="btn">Try Login Again</button>
        </div>
      `;

      // Add event listeners for error container buttons using data-route
      // These will be handled by the router's global click handler
    });
}

// Function to show mock data for testing
function showMockData(container) {
  const mockData = {
    id: 123,
    name: "Test User",
    login: "testuser",
    xp: 621000,
    level: 42,
    grades: [
      {
        subject: "JavaScript Basics",
        score: 1,
        status: "Passed",
        date: "2024-01-15",
      },
      { subject: "GraphQL", score: 0.8, status: "Passed", date: "2024-01-10" },
      { subject: "HTML/CSS", score: 0, status: "Failed", date: "2024-01-05" },
    ],
    audits: [
      {
        title: "Peer Review",
        status: "Passed",
        grade: 1,
        evaluator: "peer1",
        date: "2024-01-12",
      },
      {
        title: "Code Review",
        status: "Passed",
        grade: 0.9,
        evaluator: "peer2",
        date: "2024-01-08",
      },
    ],
    stats: {
      totalProjects: 3,
      passedProjects: 2,
      successRate: 67,
      auditRatio: 100,
    },
  };

  container.innerHTML = `
    <div class="profile-header">
      <h2>
        <svg width="36" height="36" viewBox="0 0 64 64" fill="none" style="vertical-align:middle;margin-right:8px;">
          <circle cx="32" cy="32" r="30" fill="#fff" fill-opacity="0.12"/>
          <path d="M32 12L56 26L32 40L8 26L32 12Z" fill="#fff" fill-opacity="0.22"/>
          <path d="M32 44V52" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          <circle cx="32" cy="32" r="8" fill="#e8491d" stroke="#fff" stroke-width="2"/>
        </svg>
        ${mockData.name}'s Profile (Test Mode)
      </h2>
      <div class="profile-nav">
        <button data-route="home" class="btn">Home</button>
        <button data-route="stats" class="btn">View Statistics</button>
        <button id="logout-btn-mock" class="btn-logout">Logout</button>
      </div>
    </div>
    <div class="profile-content">
      <div class="profile-info">
        <p><strong>ID:</strong> ${mockData.id}</p>
        <p><strong>Login:</strong> ${mockData.login}</p>
        <p><strong>XP:</strong> ${Number(mockData.xp).toLocaleString()}</p>
        <p><strong>Level:</strong> ${mockData.level}</p>
      </div>
      
      <div class="profile-section">
        <h3>Recent Grades (${mockData.grades.length})</h3>
        <ul>
          ${mockData.grades
            .map(
              (grade) =>
                `<li><strong>${grade.subject}:</strong> ${grade.score} (${grade.status}) - ${grade.date}</li>`
            )
            .join("")}
        </ul>
      </div>
      
      <div class="profile-section">
        <h3>Recent Audits (${mockData.audits.length})</h3>
        <ul>
          ${mockData.audits
            .map(
              (audit) =>
                `<li><strong>${audit.title}:</strong> ${audit.status} (${audit.grade}) by ${audit.evaluator} - ${audit.date}</li>`
            )
            .join("")}
        </ul>
      </div>

      <div class="profile-section">
        <h3>Auth Status</h3>
        <p>No valid JWT token found. Using test data.</p>
        <p><strong>Note:</strong> Please login with valid credentials to see real data.</p>
      </div>
    </div>
  `;

  // Add logout handler for mock data - check if element exists first
  const mockLogoutBtn = document.getElementById("logout-btn-mock");
  if (mockLogoutBtn) {
    mockLogoutBtn.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("profileData");
      import("../services/router.js").then((module) => {
        module.Router.navigateTo("login");
      });
    });
  }

  // Store mock data for stats page
  localStorage.setItem("profileData", JSON.stringify(mockData));
}
