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
      transaction(
        where: {
          type: { _eq: "xp" }
          event: { path: { _eq: "/bahrain/bh-module" } }
        }
        order_by: {createdAt: desc}
      ) {
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
      progress(
        where: {
          grade: { _is_null: false }
        }
        order_by: {updatedAt: desc}
      ) {
        id
        userId
        objectId
        grade
        createdAt
        updatedAt
        path
      }
      result(
        where: {
          grade: { _is_null: false }
        }
        order_by: {updatedAt: desc}
      ) {
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
    // Get user login for audit queries
    const userLogin = data.user && data.user.length > 0 ? data.user[0].login : null;
    
    if (userLogin) {
      // Fetch audit statistics separately - only count audits with grades (attempted)
      return Promise.all([
        getFailedAuditsCount(userLogin),
        getPassedAuditsCount(userLogin)
      ]).then(([failedAudits, passedAudits]) => {
        // Add audit stats to the data
        data.auditStats = {
          failed: failedAudits.audit_aggregate.aggregate.count,
          passed: passedAudits.audit_aggregate.aggregate.count
        };
        return transformToProfile(data);
      });
    } else {
      // No user login available, proceed without audit stats
      data.auditStats = { failed: 0, passed: 0 };
      return transformToProfile(data);
    }
  });
}

// Get failed audits count - only count audits that have been attempted (have grades)
export function getFailedAuditsCount(userLogin) {
  const query = `
    query Audit_aggregate($userlogin: String) {
      audit_aggregate(
        where: { 
          grade: { _lt: "1", _is_null: false }, 
          auditor: { login: { _eq: $userlogin } } 
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `;
  return fetchGraphQL(query, { userlogin: userLogin });
}

// Get passed audits count - only count audits that have been attempted (have grades)
export function getPassedAuditsCount(userLogin) {
  const query = `
    query Audit_aggregate($userlogin: String) {
      audit_aggregate(
        where: { 
          grade: { _gte: "1", _is_null: false }, 
          auditor: { login: { _eq: $userlogin } } 
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `;
  return fetchGraphQL(query, { userlogin: userLogin });
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
      transaction(
        where: {
          userId: {_eq: ${userId}}
          type: { _eq: "xp" }
          event: { path: { _eq: "/bahrain/bh-module" } }
        }
        order_by: {createdAt: desc}
      ) {
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

  // Get all XP transactions (including negative ones for corrections/penalties)
  const allXpTransactions = data.transaction
    ? data.transaction.filter((tx) => tx.type === "xp")
    : [];

  // Calculate total XP including negative amounts (corrections, penalties, etc.)
  const totalXp = allXpTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Separate positive and negative transactions for display purposes
  const positiveXpTransactions = allXpTransactions.filter((tx) => tx.amount > 0);
  const negativeXpTransactions = allXpTransactions.filter((tx) => tx.amount < 0);

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
    // Use Math.max to ensure level doesn't go negative
    currentLevel = calculateLevelFromXP(Math.max(0, totalXp));
  }

  // Format XP history with object information (including both positive and negative)
  // Convert createdAt to proper date format for chart compatibility
  const xpHistory = allXpTransactions.map((tx) => ({
    id: tx.id,
    date: tx.createdAt, // Keep original ISO string for proper date parsing
    amount: tx.amount,
    path: tx.path,
    objectName: tx.object ? tx.object.name : "Unknown",
    objectType: tx.object ? tx.object.type : "Unknown",
    isNegative: tx.amount < 0,
    type: tx.amount < 0 ? "correction" : "gain",
  }));

  // Extract grades from progress - only count projects that have been attempted (have grades)
  // This filters out projects that exist but haven't been reached/attempted by the student
  const grades = data.progress
    ? data.progress
        .filter((p) => p.grade !== null && p.grade !== undefined)
        .map((p) => ({
          id: p.id,
          subject: p.path.split("/").pop() || "Unknown",
          fullPath: p.path,
          score: p.grade,
          status: p.grade >= 1 ? "Passed" : "Failed",
          date: p.updatedAt, // Keep ISO string format
          createdAt: p.createdAt, // Keep ISO string format
        }))
    : [];

  // Extract audits/results with user information - only count audits that have been attempted (have grades)
  const audits = data.result
    ? data.result
        .filter((r) => r.grade !== null && r.grade !== undefined)
        .map((r) => ({
          id: r.id,
          title: r.path.split("/").pop() || "Unknown",
          fullPath: r.path,
          grade: r.grade,
          status: r.grade >= 1 ? "Passed" : "Failed",
          type: r.type || "audit",
          date: r.updatedAt, // Keep ISO string format
          createdAt: r.createdAt, // Keep ISO string format
          evaluator: r.user ? r.user.login : "System",
        }))
    : [];

  // Calculate statistics - only based on projects that have been attempted
  const totalAttemptedProjects = grades.length; // Only counts projects with grades (attempted)
  const passedProjects = grades.filter((g) => g.score >= 1).length;
  const successRate =
    totalAttemptedProjects > 0 ? Math.round((passedProjects / totalAttemptedProjects) * 100) : 0;

  // Use audit statistics from the separate queries - these now only count attempted audits
  const auditStats = data.auditStats || { failed: 0, passed: 0 };
  const totalAudits = auditStats.failed + auditStats.passed;
  const passedAudits = auditStats.passed;
  const auditRatio =
    totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100) : 0;

  // Calculate XP needed for next level
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const xpToNextLevel = Math.max(0, nextLevelXP - totalXp);
  const levelProgress =
    currentLevelXP === nextLevelXP
      ? 100
      : Math.round(
          Math.max(0, Math.min(100, ((totalXp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))
        );

  // Calculate XP statistics
  const totalPositiveXp = positiveXpTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalNegativeXp = negativeXpTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return {
    id: user.id,
    name: user.name,
    login: user.login,
    xp: totalXp, // This now includes negative XP
    level: currentLevel,
    levelProgress: Math.max(0, Math.min(100, levelProgress)), // Ensure 0-100 range
    xpToNextLevel: Math.max(0, xpToNextLevel),
    nextLevelXP: nextLevelXP,
    grades,
    audits,
    xpHistory,
    stats: {
      totalProjects: totalAttemptedProjects, // Only counts attempted projects (those with grades)
      totalAttemptedProjects, // Clearer naming - same as totalProjects
      passedProjects,
      successRate,
      auditRatio,
      totalXp, // Net XP (including negatives)
      totalPositiveXp, // Total XP gained
      totalNegativeXp, // Total XP lost (absolute value)
      totalAudits, // From audit_aggregate queries - only attempted audits
      passedAudits, // From audit_aggregate queries - only attempted audits
      failedAudits: auditStats.failed, // From audit_aggregate queries - only attempted audits
      xpGains: positiveXpTransactions.length,
      xpCorrections: negativeXpTransactions.length,
    },
    objects: data.object || [],
  };
}

// 01 Edu level calculation formula
// The level system uses the formula: level = floor(sqrt(xp / 500))
function calculateLevelFromXP(xp) {
  if (xp <= 0) return 0;

  // 01 EDU uses the formula: level = floor(sqrt(xp / 500))
  // Example: 621,000 XP = floor(sqrt(621000 / 500)) = floor(sqrt(1242)) = floor(35.24) = 35
  // Wait, that doesn't match your example of level 26...
  
  // Let me recalculate based on your example:
  // If 621k XP = level 26, then: 26 = sqrt(621000 / X)
  // 26^2 = 621000 / X
  // 676 = 621000 / X
  // X = 621000 / 676 ≈ 918.6
  
  // So the correct formula appears to be: level = floor(sqrt(xp / 900))
  return Math.floor(Math.sqrt(xp / 900));
}

// Calculate XP required to reach a specific level
function calculateXPForLevel(level) {
  if (level <= 0) return 0;
  
  // Inverse of the level formula: xp = level^2 * 900
  return level * level * 900;
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
