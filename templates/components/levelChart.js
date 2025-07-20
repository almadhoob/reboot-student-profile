export function createXPProgressChart(xpHistory, containerId, options = {}) {
  const {
    width = 600,
    height = 350,
    margin = { top: 20, right: 30, bottom: 40, left: 60 },
    showNegative = false, // Changed to false to hide corrections
    timeRange = '6months' // Changed default to 6 months
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // Clear existing content
  container.innerHTML = '';

  // Filter data based on time range - only show last 6 months by default
  const now = new Date();
  const filteredHistory = xpHistory.filter(entry => {
    if (timeRange === 'all') return true;
    
    const entryDate = new Date(entry.date);
    const monthsBack = 6; // Default to 6 months
    
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
    return entryDate >= cutoffDate;
  });

  // Filter out negative XP transactions (corrections/penalties)
  const positiveXpHistory = filteredHistory.filter(entry => entry.amount > 0);

  if (positiveXpHistory.length === 0) {
    container.innerHTML = '<p class="no-data">No XP data available for the selected time period</p>';
    return;
  }

  // Sort by date and calculate cumulative XP for positive transactions only
  const sortedData = positiveXpHistory
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry, index, array) => {
      const cumulativeXP = array.slice(0, index + 1).reduce((sum, e) => sum + e.amount, 0);
      return {
        ...entry,
        cumulativeXP,
        dateObj: new Date(entry.date)
      };
    });

  // Chart dimensions
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.background = 'transparent';

  // Create chart group
  const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  chartGroup.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
  svg.appendChild(chartGroup);

  // Calculate scales
  const xExtent = [
    Math.min(...sortedData.map(d => d.dateObj)),
    Math.max(...sortedData.map(d => d.dateObj))
  ];
  
  const yExtent = [
    0, // Always start from 0 for cumulative XP
    Math.max(...sortedData.map(d => d.cumulativeXP))
  ];

  // Scale functions
  const xScale = (date) => {
    const timeRange = xExtent[1] - xExtent[0];
    return ((date - xExtent[0]) / timeRange) * chartWidth;
  };

  const yScale = (value) => {
    const valueRange = yExtent[1] - yExtent[0];
    return chartHeight - ((value - yExtent[0]) / valueRange) * chartHeight;
  };

  // Create grid lines
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('class', 'grid');
  chartGroup.appendChild(gridGroup);

  // Horizontal grid lines
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yValue = yExtent[0] + (yExtent[1] - yExtent[0]) * (i / yTicks);
    const y = yScale(yValue);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('x2', chartWidth);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
    line.setAttribute('stroke-width', 1);
    gridGroup.appendChild(line);
  }

  // Create axes
  const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  axesGroup.setAttribute('class', 'axes');
  chartGroup.appendChild(axesGroup);

  // X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', 0);
  xAxis.setAttribute('x2', chartWidth);
  xAxis.setAttribute('y1', chartHeight);
  xAxis.setAttribute('y2', chartHeight);
  xAxis.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  xAxis.setAttribute('stroke-width', 2);
  axesGroup.appendChild(xAxis);

  // Y-axis
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', 0);
  yAxis.setAttribute('x2', 0);
  yAxis.setAttribute('y1', 0);
  yAxis.setAttribute('y2', chartHeight);
  yAxis.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  yAxis.setAttribute('stroke-width', 2);
  axesGroup.appendChild(yAxis);

  // Create area fill (positive XP only)
  if (sortedData.length > 1) {
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = `M 0 ${yScale(0)}`;
    
    sortedData.forEach(d => {
      pathData += ` L ${xScale(d.dateObj)} ${yScale(d.cumulativeXP)}`;
    });
    
    pathData += ` L ${chartWidth} ${yScale(0)} Z`;
    
    areaPath.setAttribute('d', pathData);
    areaPath.setAttribute('fill', 'rgba(102, 126, 234, 0.2)');
    areaPath.setAttribute('stroke', 'none');
    chartGroup.appendChild(areaPath);
  }

  // Create main line
  const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  lineGroup.setAttribute('class', 'line');
  chartGroup.appendChild(lineGroup);

  if (sortedData.length > 1) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = `M ${xScale(sortedData[0].dateObj)} ${yScale(sortedData[0].cumulativeXP)}`;
    
    for (let i = 1; i < sortedData.length; i++) {
      pathData += ` L ${xScale(sortedData[i].dateObj)} ${yScale(sortedData[i].cumulativeXP)}`;
    }
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#667eea');
    path.setAttribute('stroke-width', 3);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    lineGroup.appendChild(path);
  }

  // Add data points
  const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'points');
  chartGroup.appendChild(pointsGroup);

  sortedData.forEach((d, index) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', xScale(d.dateObj));
    circle.setAttribute('cy', yScale(d.cumulativeXP));
    circle.setAttribute('r', 4);
    circle.setAttribute('fill', '#667eea');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', 2);
    circle.style.cursor = 'pointer';
    
    // Add tooltip on hover
    circle.addEventListener('mouseenter', (e) => {
      showTooltip(e, d, container);
    });
    
    circle.addEventListener('mouseleave', () => {
      hideTooltip();
    });
    
    pointsGroup.appendChild(circle);
  });

  // Add Y-axis labels
  const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsGroup.setAttribute('class', 'labels');
  chartGroup.appendChild(labelsGroup);

  for (let i = 0; i <= yTicks; i++) {
    const yValue = yExtent[0] + (yExtent[1] - yExtent[0]) * (i / yTicks);
    const y = yScale(yValue);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', -10);
    text.setAttribute('y', y + 4);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('font-family', 'Inter, Arial, sans-serif');
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
    text.textContent = formatXP(Math.round(yValue));
    labelsGroup.appendChild(text);
  }

  // Add X-axis labels (dates)
  const xTicks = Math.min(6, sortedData.length);
  for (let i = 0; i < xTicks; i++) {
    const dataIndex = Math.floor((sortedData.length - 1) * (i / (xTicks - 1)));
    const d = sortedData[dataIndex];
    const x = xScale(d.dateObj);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', chartHeight + 20);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'Inter, Arial, sans-serif');
    text.setAttribute('font-size', '11');
    text.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
    text.textContent = d.dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    labelsGroup.appendChild(text);
  }

  // Add axis labels
  const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yLabel.setAttribute('transform', `translate(15, ${height / 2}) rotate(-90)`);
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('font-family', 'Inter, Arial, sans-serif');
  yLabel.setAttribute('font-size', '14');
  yLabel.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
  svg.appendChild(yLabel);

  container.appendChild(svg);

  // Add simplified legend (no XP corrections)
  createLegend(container);
}

function createLegend(container) {
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  legend.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 16px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  `;

  const positiveItem = document.createElement('div');
  positiveItem.style.cssText = 'display: flex; align-items: center; gap: 8px;';
  positiveItem.innerHTML = `
    <div style="width: 12px; height: 12px; background: #667eea; border-radius: 50%;"></div>
    <span>XP Progress</span>
  `;
  legend.appendChild(positiveItem);

  container.appendChild(legend);
}

let currentTooltip = null;

function showTooltip(event, data, container) {
  hideTooltip();
  
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
    max-width: 200px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  `;
  
  tooltip.innerHTML = `
    <div><strong>${data.objectName}</strong></div>
    <div>Date: ${new Date(data.date).toLocaleDateString()}</div>
    <div>XP Gained: +${data.amount.toLocaleString()}</div>
    <div>Total XP: ${data.cumulativeXP.toLocaleString()}</div>
    <div style="color: #ccc; font-size: 10px; margin-top: 4px;">${data.objectType}</div>
  `;
  
  container.style.position = 'relative';
  container.appendChild(tooltip);
  
  const rect = container.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  tooltip.style.left = `${event.clientX - rect.left - tooltipRect.width / 2}px`;
  tooltip.style.top = `${event.clientY - rect.top - tooltipRect.height - 10}px`;
  
  currentTooltip = tooltip;
}

function hideTooltip() {
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
}

// Helper function to format XP
function formatXP(xp) {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
}

// Export the main function
export default createXPProgressChart;
