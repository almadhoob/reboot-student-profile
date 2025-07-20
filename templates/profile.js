import { getStudentProfile } from "../services/graphql.js";
import createXPProgressChart from "./components/levelChart.js";
import createGradesChart from "./components/gradesChart.js";

export function renderProfileView(container) {
  // Set app container styles for profile page
  const app = document.getElementById("app");
  app.style.alignItems = "flex-start";
  app.style.paddingTop = "40px";
  app.style.paddingBottom = "40px";

  container.innerHTML = `
    <div class="profile-page">
      <div class="profile-loading">
        <div class="loading-spinner"></div>
        <h2>Loading your profile...</h2>
        <p>Fetching your academic progress and achievements</p>
      </div>
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

  getStudentProfile(userId)
    .then((profileData) => {
      if (!profileData) {
        throw new Error("No profile data received");
      }

      renderProfileContent(profileData, container);

      // Store profile data in localStorage for future use
      localStorage.setItem("profileData", JSON.stringify(profileData));
    })
    .catch((error) => {
      console.error("Profile loading error:", error);
      container.innerHTML = `
        <div class="profile-page">
          <div class="profile-error">
            <svg class="error-icon" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea"/>
                  <stop offset="100%" style="stop-color:#764ba2"/>
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="28" stroke="url(#errorGradient)" stroke-width="4" fill="none"/>
              <path d="M22 22l20 20M42 22l-20 20" stroke="url(#errorGradient)" stroke-width="3"/>
            </svg>
            <h2>Error Loading Profile</h2>
            <p>${error.message}</p>
            <p>This could be due to incorrect API schema, authentication issues, or network problems.</p>
            <div class="debug-info">
              <details>
                <summary>Debug Information</summary>
                <p><strong>Token exists:</strong> ${Boolean(token)}</p>
                <p><strong>User ID:</strong> ${
                  userId || "Not found in token"
                }</p>
                <p><strong>Error details:</strong> ${
                  error.stack || error.message
                }</p>
              </details>
            </div>
            <div class="error-actions">
              <button data-route="home" class="btn-primary">Return Home</button>
              <button data-route="login" class="btn-secondary">Try Login Again</button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners for error container buttons
      container.querySelectorAll("[data-route]").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const route = button.getAttribute("data-route");
          import("../services/router.js").then((module) => {
            module.Router.navigateTo(route);
          });
        });
      });
    });
}

function renderProfileContent(profileData, container) {
  const totalGrades = (profileData.grades || []).length;
  const totalAudits = profileData.stats?.totalAudits || 0;
  
  const passedGrades = (profileData.grades || []).filter(
    (g) => g.status === "Passed"
  ).length;

  // Format XP for display - show actual XP without subtracting base amount
  const currentLevel = profileData.level || 0;
  const displayXP = profileData.xp || 0;
  const formattedXP = formatXPForDisplay(displayXP);
  
  // Sort grades and audits by date (most recent first)
  const sortedGrades = (profileData.grades || [])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  container.innerHTML = `
    <div class="profile-page">
      <!-- Profile Header -->
      <div class="profile-header-card">
        <div class="profile-avatar">
          <svg viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea"/>
                <stop offset="100%" style="stop-color:#764ba2"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#avatarGradient)" fill-opacity="0.2"/>
            <path d="M32 12L56 26L32 40L8 26L32 12Z" fill="url(#avatarGradient)" fill-opacity="0.8"/>
            <circle cx="32" cy="32" r="8" fill="#667eea" stroke="#fff" stroke-width="2"/>
          </svg>
        </div>
        <div class="profile-info">
          <h1>${profileData.name || "Student"}</h1>
          <p class="profile-subtitle">@${
            profileData.login || "student"
          }</p>
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">${formattedXP}</span>
              <span class="stat-label">Total XP</span>
            </div>
            <div class="stat">
              <span class="stat-value">${currentLevel}</span>
              <span class="stat-label">Current Level</span>
            </div>
            <div class="stat">
              <span class="stat-value">${totalAudits}</span>
              <span class="stat-label">Audits Done</span>
            </div>
          </div>
        </div>
        <button id="logout-btn" class="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-row">
          <div class="profile-card chart-card">
            <div class="card-header">
              <h3>
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
                XP Progress
              </h3>
            </div>
            <div class="chart-container" id="xp-chart-container"></div>
          </div>

          <div class="profile-card chart-card">
            <div class="card-header">
              <h3>
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12l2 2 4-4"/>
                </svg>
                Project Progress
              </h3>
            </div>
            <div class="chart-container" id="grades-chart-container"></div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-section">
        <div class="profile-card activity-card">
          <div class="card-header">
            <h3>
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4l3-3h7a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-3 3z"/>
              </svg>
              Recent Grades
            </h3>
            <div class="activity-header-stats">
              <span class="badge success">${passedGrades}/${totalGrades} Done</span>
            </div>
          </div>
          <div class="activity-content">
            ${
              sortedGrades.length > 0
                ? `
                  <div class="activity-list">
                    ${sortedGrades
                      .map(
                        (grade) => `
                      <div class="activity-item enhanced ${grade.status.toLowerCase()}">
                        <div class="activity-status-bar ${grade.status.toLowerCase()}"></div>
                        <div class="activity-icon-container">
                          <div class="activity-icon ${grade.status.toLowerCase()}">
                            ${getGradeIcon(grade.status, grade.score)}
                          </div>
                        </div>
                        <div class="activity-content-wrapper">
                          <div class="activity-main">
                            <span class="activity-title">${grade.subject}</span>
                            <div class="activity-meta">
                              <span class="activity-date">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12,6 12,12 16,14"/>
                                </svg>
                                ${formatRelativeDate(grade.date)}
                              </span>
                              <span class="activity-status ${grade.status.toLowerCase()}">${grade.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                : `
                  <div class="no-data-state">
                    <svg class="no-data-icon" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                      <path d="M20 32h24M32 20v24" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                    </svg>
                    <h4>No Grades Yet</h4>
                    <p>Complete some projects to see your grades appear here!</p>
                  </div>
                `
            }
          </div>
        </div>

      </div>
    </div>
  `;

  // Add logout handler
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

  // Initialize charts
  initializeCharts(profileData);

  // Add view all buttons handlers
  container.querySelectorAll(".view-all-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const type = button.getAttribute("data-type");
      showDetailedActivityModal(profileData, type);
    });
  });
}

function initializeCharts(profileData) {
  // Initialize XP Progress Chart - default to last 6 months, no negative XP
  if (profileData.xpHistory && profileData.xpHistory.length > 0) {
    createXPProgressChart(profileData.xpHistory, 'xp-chart-container', {
      showNegative: false,
      timeRange: '6months'
    });

    // Add event listener for time range selector
    const timeRangeSelector = document.getElementById('xp-time-range');
    if (timeRangeSelector) {
      // Set default value to 6 months
      timeRangeSelector.value = '6months';
      
      timeRangeSelector.addEventListener('change', (e) => {
        createXPProgressChart(profileData.xpHistory, 'xp-chart-container', {
          showNegative: false,
          timeRange: e.target.value
        });
      });
    }
  } else {
    document.getElementById('xp-chart-container').innerHTML = '<p class="no-data">No XP history available</p>';
  }

  // Initialize Grades Chart
  if (profileData.grades && profileData.grades.length > 0) {
    createGradesChart(profileData.grades, 'grades-chart-container', {
      width: 600,
      height: 400,
      chartType: 'bar'
    });

    // Add event listener for chart type selector
    const chartTypeSelector = document.getElementById('grades-chart-type');
    if (chartTypeSelector) {
      chartTypeSelector.addEventListener('change', (e) => {
        createGradesChart(profileData.grades, 'grades-chart-container', {
          width: 600,
          height: 400,
          chartType: e.target.value
        });
      });
    }
  } else {
    document.getElementById('grades-chart-container').innerHTML = '<p class="no-data">No grade data available</p>';
  }
}

// Helper functions for enhanced activity display
function getGradeIcon(status, score) {
  if (status === "Passed") {
    if (score >= 0.9) return "🏆";
    if (score >= 0.8) return "⭐";
    return "✅";
  }
  return "❌";
}

function getScoreClass(score) {
  if (score >= 0.8) return "excellent";
  if (score >= 0.6) return "good";
  if (score >= 0.4) return "fair";
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
}

function showDetailedActivityModal(profileData, type) {
  // This could be expanded to show a modal with all activities
  console.log(`Show all ${type}:`, profileData[type]);
  // For now, just log - could implement a modal in future
}

// Helper function to format XP for display
function formatXPForDisplay(xp) {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return Math.round(xp).toLocaleString();
}
