import { getStudentProfile } from "../controllers/graphql.js";

// Import charts
let renderLevelChart, renderSkillsChart, renderGradesChart;

try {
  ({ renderLevelChart } = await import("./components/charts/levelChart.js"));
  ({ renderSkillsChart } = await import("./components/charts/skillsChart.js"));
  ({ renderGradesChart } = await import("./components/charts/gradesChart.js"));
} catch (error) {
  console.warn("Chart components not available:", error);
  // Fallback implementations
  renderLevelChart = (data, containerId) => {
    document.getElementById(containerId).innerHTML =
      "<p>XP chart visualization not available</p>";
  };
  renderSkillsChart = (data, containerId) => {
    document.getElementById(containerId).innerHTML =
      "<p>Skills chart visualization not available</p>";
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
    // Use cached data if available
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

    // Fetch fresh data if no cached data is available
    getStudentProfile(userId)
      .then((profileData) => {
        if (!profileData) {
          throw new Error("No profile data received");
        }

        // Cache the data for future use
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
            <button data-view="home" class="btn">Return Home</button>
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
        <button data-view="home" class="btn">Home</button>
        <button id="logout-btn" class="btn-logout">Logout</button>
      </div>
    </div>
    
    <div class="stats-summary">
      <div class="summary-item">
        <h3>Total XP</h3>
        <p>${profileData.xp || 0}</p>
      </div>
      <div class="summary-item">
        <h3>Skills</h3>
        <p>${(profileData.skills || []).length} Acquired</p>
      </div>
      <div class="summary-item">
        <h3>Grades</h3>
        <p>${(profileData.grades || []).length} Subjects</p>
      </div>
    </div>
    
    <div class="charts-container">
      <div class="chart-section">
        <h3>XP Progress</h3>
        <div id="xp-chart" class="chart"></div>
      </div>
      
      <div class="chart-section">
        <h3>Skills Distribution</h3>
        <div id="skills-chart" class="chart"></div>
      </div>
      
      <div class="chart-section">
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
      "<p>No XP history data available</p>";
  }

  if (profileData.skills && profileData.skills.length > 0) {
    renderSkillsChart(profileData.skills, "skills-chart");
  } else {
    document.getElementById("skills-chart").innerHTML =
      "<p>No skills data available</p>";
  }

  if (profileData.grades && profileData.grades.length > 0) {
    renderGradesChart(profileData.grades, "grades-chart");
  } else {
    document.getElementById("grades-chart").innerHTML =
      "<p>No grades data available</p>";
  }
}
