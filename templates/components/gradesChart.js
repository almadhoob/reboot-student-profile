import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderGradesChart(data, containerId) {
  try {
    const container = document.getElementById(containerId);
    if (!container)
      throw new Error(`Container with ID '${containerId}' not found`);

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

    if (validData.length === 0)
      throw new Error("No valid grade data to display");

    // Chart dimensions - INCREASED size
    const width = Math.max(640, validData.length * 100);
    const height = 360;
    const margin = { top: 60, right: 40, bottom: 90, left: 80 };

    // Prepare SVG
    container.innerHTML = "";
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "chart-svg");

    // Add chart background for better contrast
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "rgba(255, 255, 255, 0.15)")
      .attr("rx", 8)
      .attr("ry", 8);

    // Limit subjects to a reasonable number with sensible names
    const processedData = validData.map((d) => ({
      subject:
        d.subject.length > 12 ? d.subject.substring(0, 10) + "..." : d.subject,
      fullSubject: d.subject,
      score: d.score,
    }));

    // X scale with better spacing
    const xScale = d3
      .scaleBand()
      .domain(processedData.map((d) => d.subject))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    // Y scale
    const maxScore = d3.max(processedData, (d) => d.score) || 100;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxScore * 1.2]) // Added more headroom
      .nice()
      .range([height - margin.bottom, margin.top]);

    // X Axis with improved readability
    svg
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em")
      .attr("font-size", "14px")
      .attr("fill", "#ffffff");

    // Y Axis with improved readability
    svg
      .append("g")
      .attr("class", "axis y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d3.format(",.2f")))
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("fill", "#ffffff");

    // Add grid lines for Y axis
    svg
      .append("g")
      .attr("class", "grid-lines")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(8)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat("")
      )
      .attr("stroke-opacity", 0.2)
      .attr("stroke", "#ffffff");

    // Y axis label
    svg
      .append("text")
      .attr("class", "chart-y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "#ffffff")

    // Chart title
    svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", margin.top - 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff")
      .text("Grades Overview");

    // Bars with enhanced styling
    svg
      .selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("rx", 6) // Rounded corners
      .attr("ry", 6)
      .attr("x", (d) => xScale(d.subject))
      .attr("y", (d) => yScale(d.score))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - margin.bottom - yScale(d.score))
      .attr("fill", "#ff7e5f")
      .attr("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("fill", "#e8491d")
          .attr("filter", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))");

        // Show tooltip with full subject name
        const tooltip = svg
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${xScale(d.subject) + xScale.bandwidth() / 2}, ${
              yScale(d.score) - 15
            })`
          );

        tooltip
          .append("rect")
          .attr("x", -120)
          .attr("y", -40)
          .attr("width", 240)
          .attr("height", 36)
          .attr("fill", "rgba(0, 0, 0, 0.8)")
          .attr("rx", 5)
          .attr("ry", 5);

        tooltip
          .append("text")
          .attr("x", 0)
          .attr("y", -16)
          .attr("text-anchor", "middle")
          .attr("fill", "#ffffff")
          .attr("font-size", "15px")
          .text(`${d.fullSubject}: ${d.score.toFixed(2)}`);
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("fill", "#ff7e5f")
          .attr("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))");
        svg.selectAll(".tooltip").remove();
      });

    // Value labels (above bars)
    svg
      .selectAll(".chart-label")
      .data(processedData)
      .enter()
      .append("text")
      .attr("class", "chart-label")
      .attr("x", (d) => xScale(d.subject) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.score) - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "15px")
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff")
      .attr("filter", "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))")
      .text((d) => d.score.toFixed(2));

    return svg.node();
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
