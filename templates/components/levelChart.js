import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderLevelChart(data, containerId) {
  try {
    const container = document.getElementById(containerId);
    if (!container)
      throw new Error(`Container with ID '${containerId}' not found`);

    // Clean and validate the data
    const validData = data
      .filter((item) => {
        const hasDate = item.date !== undefined && item.date !== null;
        const hasValue =
          (item.xp !== undefined && !isNaN(Number(item.xp))) ||
          (item.amount !== undefined && !isNaN(Number(item.amount)));
        return hasDate && hasValue;
      })
      .map((item) => ({
        date: item.date,
        value: Number(item.xp !== undefined ? item.xp : item.amount),
      }));

    if (validData.length === 0)
      throw new Error("No valid data points to display");

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

    // X scale: use date labels or fallback
    const xLabels = validData.map((d, i) =>
      d.date instanceof Date
        ? d.date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : typeof d.date === "string"
        ? d.date
        : `Item ${i + 1}`
    );
    const xScale = d3
      .scaleBand()
      .domain(xLabels)
      .range([margin.left, width - margin.right])
      .padding(0.4); // Increased padding between bars

    // Y scale
    const maxValue = d3.max(validData, (d) => d.value) || 100;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.2]) // Added more headroom
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
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d3.format(",.0f")))
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
      .text("XP Progress");

    // Bars with enhanced styling
    svg
      .selectAll(".bar")
      .data(validData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("rx", 6) // Rounded corners
      .attr("ry", 6)
      .attr("x", (d, i) => xScale(xLabels[i]))
      .attr("y", (d) => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - margin.bottom - yScale(d.value))
      .attr("fill", "#ff7e5f")
      .attr("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("fill", "#e8491d")
          .attr("filter", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))");

        // Show tooltip
        const tooltip = svg
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${
              xScale(xLabels[validData.indexOf(d)]) + xScale.bandwidth() / 2
            }, ${yScale(d.value) - 15})`
          );

        tooltip
          .append("rect")
          .attr("x", -50)
          .attr("y", -40)
          .attr("width", 100)
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
          .text(d.value.toLocaleString());
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("fill", "#ff7e5f")
          .attr("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))");
        svg.selectAll(".tooltip").remove();
      });

    // Value labels (rounded, above bars) - only show for larger values
    svg
      .selectAll(".chart-label")
      .data(validData)
      .enter()
      .append("text")
      .attr("class", "chart-label")
      .attr("x", (d, i) => xScale(xLabels[i]) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.value) - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "15px")
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff")
      .attr("filter", "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))")
      .text((d) =>
        d.value >= 1000
          ? d3.format(",.0f")(d.value)
          : Number(d.value).toFixed(d.value % 1 === 0 ? 0 : 1)
      );

    return svg.node();
  } catch (error) {
    console.error("Error rendering level chart:", error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p>Unable to render XP chart: ${error.message}</p>
          <p>Try refreshing the page or contact support if the issue persists.</p>
        </div>
      `;
    }
  }
}
