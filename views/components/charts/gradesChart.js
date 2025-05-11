import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderGradesChart(data, containerId) {
  try {
    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }

    // Validate and clean the data
    const validData = data
      .filter(
        (d) =>
          d &&
          d.subject &&
          d.score !== undefined &&
          d.score !== null &&
          !isNaN(Number(d.score))
      )
      .map((d) => ({
        subject: d.subject,
        score: Number(d.score),
      }));

    if (validData.length === 0) {
      throw new Error("No valid grade data to display");
    }

    const svgNamespace = "http://www.w3.org/2000/svg";
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    // Create scales with validation
    const xScale = d3
      .scaleBand()
      .domain(validData.map((d) => d.subject))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    // Ensure max score is valid, default to 100 if not
    const maxScore = d3.max(validData, (d) => d.score) || 100;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxScore * 1.1]) // Add 10% padding
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    try {
      svg.appendChild(
        d3
          .select(svg)
          .append("g")
          .call(xAxis)
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .node()
      );

      svg.appendChild(
        d3
          .select(svg)
          .append("g")
          .call(yAxis)
          .attr("transform", `translate(${margin.left},0)`)
          .node()
      );
    } catch (axisError) {
      console.error("Error creating axes:", axisError);
    }

    // Add title
    const title = document.createElementNS(svgNamespace, "text");
    title.setAttribute("x", width / 2);
    title.setAttribute("y", margin.top / 2);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-size", "14px");
    title.textContent = "Grades Overview";
    svg.appendChild(title);

    // Use vanilla DOM for creating bars to avoid NaN issues
    validData.forEach((d) => {
      try {
        // Calculate bar dimensions with validation
        const x = xScale(d.subject);
        const y = yScale(d.score);
        const barWidth = xScale.bandwidth();
        const barHeight = height - margin.bottom - y;

        // Skip invalid bars
        if (
          isNaN(x) ||
          isNaN(y) ||
          isNaN(barWidth) ||
          isNaN(barHeight) ||
          barHeight < 0
        ) {
          console.warn(
            `Skipping invalid bar for subject: ${d.subject}, score: ${d.score}`
          );
          return;
        }

        // Create rect element
        const bar = document.createElementNS(svgNamespace, "rect");
        bar.setAttribute("class", "bar");
        bar.setAttribute("x", x);
        bar.setAttribute("y", y);
        bar.setAttribute("width", barWidth);
        bar.setAttribute("height", barHeight);
        bar.setAttribute("fill", "steelblue");

        // Add hover effect
        bar.addEventListener("mouseover", () => {
          bar.setAttribute("fill", "#ff7f0e");
        });

        bar.addEventListener("mouseout", () => {
          bar.setAttribute("fill", "steelblue");
        });

        svg.appendChild(bar);

        // Add score label
        const label = document.createElementNS(svgNamespace, "text");
        label.setAttribute("x", x + barWidth / 2);
        label.setAttribute("y", y - 5);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10px");
        label.textContent = d.score;
        svg.appendChild(label);
      } catch (barError) {
        console.error(`Error creating bar for subject ${d.subject}:`, barError);
      }
    });

    // Clear and append to container
    container.innerHTML = "";
    container.appendChild(svg);

    return svg;
  } catch (error) {
    console.error("Error rendering grades chart:", error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p>Unable to render grades chart: ${error.message}</p>
          <ul>
            ${data
              .map(
                (grade) =>
                  `<li>${grade.subject || "Unknown"}: ${
                    grade.score !== undefined ? grade.score : "N/A"
                  }</li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    }
  }
}
