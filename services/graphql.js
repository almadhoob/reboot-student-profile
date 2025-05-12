export function fetchGraphQL(query, variables = {}) {
  const token = localStorage.getItem("authToken");

  return fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GraphQL response error:", errorText);
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.errors) {
        throw new Error(data.errors.map((error) => error.message).join(", "));
      }
      return data.data;
    });
}

export function getStudentProfile(userId) {
  // Updated query to get both XP and level transactions, plus user level if available
  const query = `
    query {
      user {
        id
        login
      }
      transaction(order_by: {createdAt: desc}) {
        id
        type
        amount
        createdAt
        path
        objectId
        object {
          id
          name
          type
        }
      }
      progress(order_by: {updatedAt: desc}) {
        id
        userId
        objectId
        grade
        createdAt
        updatedAt
        path
      }
      result(order_by: {updatedAt: desc}) {
        id
        objectId
        userId
        grade
        type
        createdAt
        updatedAt
        path
        user {
          id
          login
        }
      }
      object(limit: 20) {
        id
        name
        type
        attrs
      }
    }
  `;
  return fetchGraphQL(query).then((data) => {
    // Transform raw data into a profile format
    return transformToProfile(data);
  });
}

// Get specific object information using arguments
export function getObjectById(objectId) {
  const query = `
    query {
      object(where: {id: {_eq: ${objectId}}}) {
        id
        name
        type
        attrs
      }
    }
  `;
  return fetchGraphQL(query);
}

// Get user's XP transactions with nested object information
export function getUserXPTransactions(userId) {
  const query = `
    query {
      transaction(where: {userId: {_eq: ${userId}}, type: {_eq: "xp"}}, order_by: {createdAt: desc}) {
        id
        type
        amount
        createdAt
        path
        object {
          id
          name
          type
        }
        user {
          id
          login
        }
      }
    }
  `;
  return fetchGraphQL(query);
}

// Get user's results with nested user information
export function getUserResults(userId) {
  const query = `
    query {
      result(where: {userId: {_eq: ${userId}}}, order_by: {updatedAt: desc}) {
        id
        objectId
        grade
        type
        createdAt
        updatedAt
        path
        user {
          id
          login
        }
      }
    }
  `;
  return fetchGraphQL(query);
}

// Transform the raw GraphQL data into a structured profile
function transformToProfile(data) {
  if (!data || !data.user || data.user.length === 0) {
    throw new Error("No user data found");
  }

  const user = data.user[0];

  // Calculate total XP from XP transactions only (exclude negative amounts like corrections)
  const xpTransactions = data.transaction
    ? data.transaction.filter((tx) => tx.type === "xp" && tx.amount > 0)
    : [];

  const totalXp = xpTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Get level from level transactions or calculate from XP
  const levelTransactions = data.transaction
    ? data.transaction.filter((tx) => tx.type === "level")
    : [];

  // Use the latest level transaction, or calculate from XP if no level transactions
  let currentLevel = 0;
  if (levelTransactions.length > 0) {
    // Sort by date and get the most recent level
    const sortedLevels = levelTransactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    currentLevel = sortedLevels[0].amount;
  } else {
    // Calculate level from total XP using 01 Edu formula
    currentLevel = calculateLevelFromXP(totalXp);
  }

  // Format XP history with object information (only positive XP gains)
  const xpHistory = xpTransactions.map((tx) => ({
    id: tx.id,
    date: new Date(tx.createdAt).toLocaleDateString(),
    amount: tx.amount,
    path: tx.path,
    objectName: tx.object ? tx.object.name : "Unknown",
    objectType: tx.object ? tx.object.type : "Unknown",
  }));

  // Extract grades from progress (grade 1 means passed, 0 means failed)
  const grades = data.progress
    ? data.progress
        .filter((p) => p.grade !== null)
        .map((p) => ({
          id: p.id,
          subject: p.path.split("/").pop() || "Unknown",
          fullPath: p.path,
          score: p.grade,
          status: p.grade >= 1 ? "Passed" : "Failed",
          date: new Date(p.updatedAt).toLocaleDateString(),
          createdAt: new Date(p.createdAt).toLocaleDateString(),
        }))
    : [];

  // Extract audits/results with user information
  const audits = data.result
    ? data.result.map((r) => ({
        id: r.id,
        title: r.path.split("/").pop() || "Unknown",
        fullPath: r.path,
        grade: r.grade,
        status: r.grade >= 1 ? "Passed" : "Failed",
        type: r.type || "audit",
        date: new Date(r.updatedAt).toLocaleDateString(),
        createdAt: new Date(r.createdAt).toLocaleDateString(),
        evaluator: r.user ? r.user.login : "System",
      }))
    : [];

  // Calculate success rate
  const totalProjects = grades.length;
  const passedProjects = grades.filter((g) => g.score >= 1).length;
  const successRate =
    totalProjects > 0 ? Math.round((passedProjects / totalProjects) * 100) : 0;

  // Calculate audit ratio properly
  const passedAudits = audits.filter((a) => a.status === "Passed").length;
  const totalAudits = audits.length;
  const auditRatio =
    totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100) : 0;

  // Calculate XP needed for next level
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const xpToNextLevel = nextLevelXP - totalXp;
  const levelProgress =
    currentLevelXP === nextLevelXP
      ? 100
      : Math.round(
          ((totalXp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        );

  return {
    id: user.id,
    name: user.login,
    login: user.login,
    xp: totalXp,
    level: currentLevel,
    levelProgress: Math.max(0, Math.min(100, levelProgress)), // Ensure 0-100 range
    xpToNextLevel: Math.max(0, xpToNextLevel),
    nextLevelXP: nextLevelXP,
    grades,
    audits,
    xpHistory,
    stats: {
      totalProjects,
      passedProjects,
      successRate,
      auditRatio,
      totalXp,
      totalAudits,
      passedAudits,
    },
    objects: data.object || [],
  };
}

// 01 Edu level calculation formula
// The level system uses an exponential growth pattern
function calculateLevelFromXP(xp) {
  if (xp === 0) return 0;

  // 01 Edu uses a formula where each level requires more XP than the previous
  // The basic formula is: level = floor(sqrt(xp / 500))
  // But it's more complex with different XP requirements per level

  let level = 0;
  let totalXPNeeded = 0;

  while (totalXPNeeded <= xp) {
    level++;
    totalXPNeeded = calculateXPForLevel(level);
  }

  return level - 1; // Return the completed level
}

// Calculate XP required to reach a specific level
function calculateXPForLevel(level) {
  if (level === 0) return 0;

  // Each level requires exponentially more XP
  // Level 1: ~500 XP
  // Level 2: ~1500 XP
  // Level 3: ~3000 XP
  // And so on...

  // Simplified formula based on observed patterns
  // This is an approximation - the actual formula may vary
  if (level === 1) return 500;
  if (level === 2) return 1500;
  if (level === 3) return 3000;
  if (level === 4) return 5000;
  if (level === 5) return 7500;
  if (level === 6) return 10500;
  if (level === 7) return 14000;
  if (level === 8) return 18000;
  if (level === 9) return 22500;
  if (level === 10) return 27500;

  // For higher levels, use exponential growth
  // XP = 500 * level * (level + 1) / 2 * 1.5^(level/10)
  const baseXP = 500;
  const exponentialFactor = Math.pow(1.5, Math.floor(level / 10));
  return Math.floor(((baseXP * level * (level + 1)) / 2) * exponentialFactor);
}

// Calculate current level progress as percentage
function calculateLevelProgress(currentXP, level) {
  const currentLevelXP = calculateXPForLevel(level);
  const nextLevelXP = calculateXPForLevel(level + 1);

  if (currentLevelXP === nextLevelXP) return 100;

  const progressXP = currentXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return Math.max(
    0,
    Math.min(100, Math.round((progressXP / requiredXP) * 100))
  );
}

// Helper function to format XP with appropriate units
export function formatXP(xp) {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
}

// Helper function to get level color/tier
export function getLevelTier(level) {
  if (level >= 20) return { tier: "Master", color: "#FFD700" };
  if (level >= 15) return { tier: "Expert", color: "#FF6B35" };
  if (level >= 10) return { tier: "Advanced", color: "#4ECDC4" };
  if (level >= 5) return { tier: "Intermediate", color: "#45B7D1" };
  if (level >= 1) return { tier: "Beginner", color: "#96CEB4" };
  return { tier: "Novice", color: "#FFEAA7" };
}
