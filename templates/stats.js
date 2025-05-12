import { getStudentProfile } from "../services/graphql.js";

// Import charts
let renderLevelChart, renderGradesChart;

try {
  ({ renderLevelChart } = await import("./components/levelChart.js"));
  ({ renderGradesChart } = await import("./components/gradesChart.js"));
} catch (error) {
  console.warn("Chart components not available:", error);
  renderLevelChart = (data, containerId) => {
    document.getElementById(containerId).innerHTML =
      "<p>XP chart visualization not available</p>";
  };
  renderGradesChart = (data, containerId) => {
    document.getElementById(containerId).innerHTML =
      "<p>Grades chart visualization not available</p>";
  };
}

export function renderStatsView(container) {
  // Create the stats container
  let statsContainer = document.createElement("div");
  statsContainer.id = "stats-container";
  container.innerHTML = ""; // Clear the container
  container.appendChild(statsContainer);

  statsContainer.innerHTML = "<h2>Loading statistics...</h2>";

  // Check if we have cached profile data
  const cachedData = localStorage.getItem("profileData");

  if (cachedData) {
    renderStatsContent(JSON.parse(cachedData), statsContainer);
  } else {
    // Get user ID from JWT if available
    const token = localStorage.getItem("authToken");
    let userId = null;

    if (token) {
      try {
        if (token.split(".").length === 3) {
          const tokenData = JSON.parse(atob(token.split(".")[1]));
          userId =
            tokenData.user_id ||
            tokenData.sub ||
            (tokenData["https://hasura.io/jwt/claims"] &&
              tokenData["https://hasura.io/jwt/claims"]["x-hasura-user-id"]);
        }
      } catch (e) {
        console.error("Error parsing JWT token:", e);
      }
    }

    getStudentProfile(userId)
      .then((profileData) => {
        if (!profileData) throw new Error("No profile data received");
        localStorage.setItem("profileData", JSON.stringify(profileData));
        renderStatsContent(profileData, statsContainer);
      })
      .catch((error) => {
        console.error("Stats loading error:", error);
        statsContainer.innerHTML = `
          <div class="error-container">
            <h2>Error Loading Statistics</h2>
            <p>${error.message}</p>
            <button data-view="profile" class="btn">Return to Profile</button>
          </div>
        `;
      });
  }
}

function renderStatsContent(profileData, container) {
  container.innerHTML = `
    <div class="stats-header">
      <h2>${profileData.name || "Student"}'s Statistics</h2>
      <div class="stats-nav">
        <button data-view="profile" class="btn">Back to Profile</button>
        <button id="logout-btn" class="btn-logout">Logout</button>
      </div>
    </div>
    
    <div class="stats-summary">
      <div class="summary-item">
        <h3>Total XP</h3>
        <p>${Number(profileData.xp || 0).toLocaleString()}</p>
      </div>
      <div class="summary-item">
        <h3>Grades</h3>
        <p>${(profileData.grades || []).length} Subjects</p>
      </div>
      <div class="summary-item">
        <h3>Average</h3>
        <p>${
          profileData.grades && profileData.grades.length
            ? (
                profileData.grades.reduce(
                  (sum, g) => sum + Number(g.score || 0),
                  0
                ) / profileData.grades.length
              ).toFixed(2)
            : "N/A"
        }</p>
      </div>
    </div>
    
    <div class="charts-container">
      <div class="chart-section" id="xp-chart-section">
        <h3>XP Progress</h3>
        <div id="xp-chart" class="chart"></div>
      </div>
      
      <div class="chart-section" id="grades-chart-section">
        <h3>Grade Performance</h3>
        <div id="grades-chart" class="chart"></div>
      </div>
    </div>
  `;

  // Add logout handler
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  });

  // Render charts if data is available
  if (profileData.xpHistory && profileData.xpHistory.length > 0) {
    renderLevelChart(profileData.xpHistory, "xp-chart");
  } else {
    document.getElementById("xp-chart").innerHTML =
      "<div class='chart-fallback'><span>No XP history data available</span></div>";
  }

  if (profileData.grades && profileData.grades.length > 0) {
    renderGradesChart(profileData.grades, "grades-chart");
  } else {
    document.getElementById("grades-chart").innerHTML =
      "<div class='chart-fallback'><span>No grades data available</span></div>";
  }
}
