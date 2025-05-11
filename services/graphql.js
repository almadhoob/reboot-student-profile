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
  // The query needs to use the actual schema from the API
  // Based on the requirements, we need to query user, transaction, progress, result tables
  const query = `
    query {
      user {
        id
        login
      }
      transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: desc}) {
        id
        amount
        createdAt
        path
      }
      progress(order_by: {updatedAt: desc}) {
        id
        grade
        createdAt
        updatedAt
        path
      }
      result(order_by: {updatedAt: desc}) {
        id
        grade
        createdAt
        updatedAt
        path
      }
      object(limit: 10) {
        id
        name
        type
      }
    }
  `;
  return fetchGraphQL(query).then((data) => {
    // Transform raw data into a profile format
    return transformToProfile(data);
  });
}

// Transform the raw GraphQL data into a structured profile
function transformToProfile(data) {
  if (!data || !data.user || data.user.length === 0) {
    throw new Error("No user data found");
  }

  const user = data.user[0];

  // Calculate total XP
  const totalXp = data.transaction
    ? data.transaction.reduce((sum, tx) => sum + tx.amount, 0)
    : 0;

  // Format dates for history
  const xpHistory = data.transaction
    ? data.transaction.map((tx) => ({
        date: new Date(tx.createdAt).toLocaleDateString(),
        amount: tx.amount,
        path: tx.path,
      }))
    : [];

  // Extract grades from progress
  const grades = data.progress
    ? data.progress.map((p) => ({
        subject: p.path.split("/").pop() || "Unknown",
        score: p.grade,
        date: new Date(p.updatedAt).toLocaleDateString(),
      }))
    : [];

  // Extract audits (assuming they're in results)
  const audits = data.result
    ? data.result.map((r) => ({
        title: r.path.split("/").pop() || "Unknown",
        status: r.grade > 0 ? "Completed" : "Failed",
        date: new Date(r.updatedAt).toLocaleDateString(),
      }))
    : [];

  return {
    id: user.id,
    name: user.login,
    xp: totalXp,
    grades,
    audits,
    xpHistory,
  };
}
