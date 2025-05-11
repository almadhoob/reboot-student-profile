import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderSkillsChart(data, containerId) {
  try {
    // Check if D3 is available
    if (typeof d3 === "undefined") {
      throw new Error("D3.js library is not available");
    }

    // Get the container
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }

    // Clear the container
    container.innerHTML = "";

    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Create SVG using D3 instead of vanilla DOM methods
    const svg = d3.create("svg").attr("width", width).attr("height", height);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.level)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Skills Overview");

    // Add bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.name))
      .attr("y", (d) => yScale(d.level))
      .attr("height", (d) => yScale(0) - yScale(d.level))
      .attr("width", xScale.bandwidth())
      .attr("fill", "steelblue");

    // Add labels with XP values
    svg
      .selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("x", (d) => xScale(d.name) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.level) - 5)
      .text((d) => (d.xp ? `${d.xp} XP` : ""))
      .style("font-size", "10px");

    // Append the SVG to the container
    container.appendChild(svg.node());
  } catch (error) {
    console.error("Error rendering skills chart:", error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p>Unable to render skills chart: ${error.message}</p>
          <ul>
            ${data
              .map(
                (skill) =>
                  `<li>${skill.name}: Level ${skill.level} (${
                    skill.xp || 0
                  } XP)</li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    }
  }
}
