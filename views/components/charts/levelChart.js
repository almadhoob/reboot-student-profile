import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderLevelChart(data, containerId) {
  try {
    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }

    // Clean and validate the data more stringently
    const validData = data
      .filter((item) => {
        // Make sure both date and xp/amount values exist and are valid
        const hasDate = item.date !== undefined && item.date !== null;
        const hasValue =
          (item.xp !== undefined && !isNaN(Number(item.xp))) ||
          (item.amount !== undefined && !isNaN(Number(item.amount)));
        return hasDate && hasValue;
      })
      .map((item) => ({
        // Normalize data format - use either xp or amount field and ensure it's a number
        date: item.date,
        value: Number(item.xp !== undefined ? item.xp : item.amount),
      }));

    if (validData.length === 0) {
      throw new Error("No valid data points to display");
    }

    const svgNamespace = "http://www.w3.org/2000/svg";
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 50, left: 40 };

    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    // Use text labels for x-axis if dates aren't properly formatted
    const xScale = d3
      .scaleBand()
      .domain(
        validData.map((d, i) =>
          d.date instanceof Date ? d.date : `Item ${i + 1}`
        )
      )
      .range([margin.left, width - margin.right])
      .padding(0.1);

    // Ensure max value is valid, defaulting to 100 if not
    const maxValue = d3.max(validData, (d) => d.value) || 100;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1]) // Add 10% padding at top
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create X and Y axes
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => {
      // Format dates to be shorter
      if (d instanceof Date) {
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }
      return d; // Return the string label for non-Date values
    });

    const yAxis = d3.axisLeft(yScale);

    // Add axes to SVG
    try {
      svg.appendChild(
        d3
          .select(document.createElementNS(svgNamespace, "g"))
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(xAxis)
          .attr("class", "x-axis")
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .attr("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .node()
      );

      svg.appendChild(
        d3
          .select(document.createElementNS(svgNamespace, "g"))
          .attr("transform", `translate(${margin.left},0)`)
          .call(yAxis)
          .attr("class", "y-axis")
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
    title.textContent = "XP Progress";
    svg.appendChild(title);

    // Add Y axis label
    const yLabel = document.createElementNS(svgNamespace, "text");
    yLabel.setAttribute("transform", "rotate(-90)");
    yLabel.setAttribute("x", -height / 2);
    yLabel.setAttribute("y", margin.left / 3);
    yLabel.setAttribute("text-anchor", "middle");
    yLabel.textContent = "XP Amount";
    svg.appendChild(yLabel);

    // Create and add bars with additional validation
    validData.forEach((d, i) => {
      try {
        // Calculate bar positions and dimensions with validation
        const x = xScale(d.date instanceof Date ? d.date : `Item ${i + 1}`);
        const y = yScale(d.value);
        const barWidth = xScale.bandwidth();
        const barHeight = height - margin.bottom - yScale(d.value);

        // Only create bar if all values are valid numbers
        if (
          isNaN(x) ||
          isNaN(y) ||
          isNaN(barWidth) ||
          isNaN(barHeight) ||
          barHeight < 0
        ) {
          console.warn(`Skipping invalid bar for data: ${JSON.stringify(d)}`);
          return; // Skip this iteration
        }

        const bar = document.createElementNS(svgNamespace, "rect");
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

        // Add value label on top of each bar
        const label = document.createElementNS(svgNamespace, "text");
        label.setAttribute("x", x + barWidth / 2);
        label.setAttribute("y", y - 5);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10px");
        label.textContent = d.value;
        svg.appendChild(label);
      } catch (barError) {
        console.error(`Error creating bar for data point ${i}:`, barError);
      }
    });

    // Clear and append to container
    container.innerHTML = "";
    container.appendChild(svg);

    return svg;
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
