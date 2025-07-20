export function createGradesChart(grades, containerId, options = {}) {
  const {
    width = 600,
    height = 400,
    margin = { top: 40, right: 40, bottom: 40, left: 40 },
    chartType = 'bar' // 'pie', 'bar', 'donut'
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // Clear existing content
  container.innerHTML = '';

  if (!grades || grades.length === 0) {
    container.innerHTML = '<p class="no-data">No grade data available</p>';
    return;
  }

  // Calculate pass/fail statistics
  const passedProjects = grades.filter(g => g.score >= 1).length;
  const failedProjects = grades.filter(g => g.score < 1).length;
  const totalProjects = grades.length;
  const passRate = totalProjects > 0 ? (passedProjects / totalProjects) * 100 : 0;

  const data = [
    { label: 'Completed', count: passedProjects, percentage: passRate, color: '#4ECDC4' },
    { label: 'Incomplete', count: failedProjects, percentage: 100 - passRate, color: '#FF6B9D' }
  ].filter(d => d.count > 0); // Only show categories with data

  if (chartType === 'pie' || chartType === 'donut') {
    createPieChart(container, data, width, height, chartType === 'donut');
  } else if (chartType === 'bar') {
    createBarChart(container, data, width, height, margin);
  }

  // Add legend and stats
  createLegend(container, data);
}

function createPieChart(container, data, width, height, isDonut = false) {
  const radius = Math.min(width, height) / 2 - 60;
  const innerRadius = isDonut ? radius * 0.5 : 0;
  const centerX = width / 2;
  const centerY = height / 2;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.background = 'transparent';

  // Calculate angles
  let currentAngle = -Math.PI / 2; // Start from top
  const slices = data.map(d => {
    const startAngle = currentAngle;
    const sliceAngle = (d.percentage / 100) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...d,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2
    };
  });

  // Create slice paths with glow effect
  slices.forEach((slice, index) => {
    // Create glow filter
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', `glow-${index}`);
    
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '3');
    feGaussianBlur.setAttribute('result', 'coloredBlur');
    
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const path = createArcPath(centerX, centerY, innerRadius, radius, slice.startAngle, slice.endAngle);
    
    const slicePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    slicePath.setAttribute('d', path);
    slicePath.setAttribute('fill', slice.color);
    slicePath.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
    slicePath.setAttribute('stroke-width', 2);
    slicePath.style.cursor = 'pointer';
    slicePath.style.transition = 'all 0.3s ease';
    
    // Add hover effects
    slicePath.addEventListener('mouseenter', () => {
      slicePath.setAttribute('opacity', '0.8');
      slicePath.setAttribute('filter', `url(#glow-${index})`);
      showSliceTooltip(slice, centerX, centerY, radius, container);
    });
    
    slicePath.addEventListener('mouseleave', () => {
      slicePath.setAttribute('opacity', '1');
      slicePath.removeAttribute('filter');
      hideTooltip();
    });
    
    svg.appendChild(slicePath);

    // Add labels with better styling
    if (slice.percentage > 8) { // Only show labels for slices > 8%
      const labelRadius = (radius + innerRadius) / 2;
      const labelX = centerX + Math.cos(slice.midAngle) * labelRadius;
      const labelY = centerY + Math.sin(slice.midAngle) * labelRadius;
      
      const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Background circle for better text visibility
      const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bgCircle.setAttribute('cx', labelX);
      bgCircle.setAttribute('cy', labelY);
      bgCircle.setAttribute('r', 20);
      bgCircle.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
      bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
      bgCircle.setAttribute('stroke-width', 1);
      labelGroup.appendChild(bgCircle);
      
      // Percentage text
      const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      percentText.setAttribute('x', labelX);
      percentText.setAttribute('y', labelY - 3);
      percentText.setAttribute('text-anchor', 'middle');
      percentText.setAttribute('font-family', 'Inter, Arial, sans-serif');
      percentText.setAttribute('font-size', '12');
      percentText.setAttribute('font-weight', 'bold');
      percentText.setAttribute('fill', '#fff');
      percentText.textContent = `${slice.percentage.toFixed(1)}%`;
      labelGroup.appendChild(percentText);
      
      // Count text
      const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      countText.setAttribute('x', labelX);
      countText.setAttribute('y', labelY + 8);
      countText.setAttribute('text-anchor', 'middle');
      countText.setAttribute('font-family', 'Inter, Arial, sans-serif');
      countText.setAttribute('font-size', '10');
      countText.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
      countText.textContent = `(${slice.count})`;
      labelGroup.appendChild(countText);
      
      svg.appendChild(labelGroup);
    }
  });

  // Add center text for donut chart
  if (isDonut && data.length > 0) {
    const totalProjects = data.reduce((sum, d) => sum + d.count, 0);
    
    const centerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', centerX);
    totalText.setAttribute('y', centerY - 8);
    totalText.setAttribute('text-anchor', 'middle');
    totalText.setAttribute('font-family', 'Inter, Arial, sans-serif');
    totalText.setAttribute('font-size', '32');
    totalText.setAttribute('font-weight', 'bold');
    totalText.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
    totalText.textContent = totalProjects;
    centerGroup.appendChild(totalText);
    
    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', centerX);
    labelText.setAttribute('y', centerY + 12);
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('font-family', 'Inter, Arial, sans-serif');
    labelText.setAttribute('font-size', '14');
    labelText.setAttribute('fill', 'rgba(255, 255, 255, 0.7)');
    labelText.textContent = 'Total Projects';
    centerGroup.appendChild(labelText);
    
    svg.appendChild(centerGroup);
  }

  container.appendChild(svg);
}

function createBarChart(container, data, width, height, margin) {
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
  const maxCount = Math.max(...data.map(d => d.count));
  const barWidth = chartWidth / data.length * 0.6;
  const barSpacing = chartWidth / data.length;

  // Add grid lines
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('class', 'grid');
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = (chartHeight / gridLines) * i;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('x2', chartWidth);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
    line.setAttribute('stroke-width', 1);
    gridGroup.appendChild(line);
  }
  chartGroup.appendChild(gridGroup);

  // Create bars with gradients
  data.forEach((d, index) => {
    const barHeight = (d.count / maxCount) * chartHeight;
    const x = index * barSpacing + (barSpacing - barWidth) / 2;
    const y = chartHeight - barHeight;

    // Create gradient for each bar
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', `barGradient-${index}`);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', d.color);
    stop1.setAttribute('stop-opacity', '0.8');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', d.color);
    stop2.setAttribute('stop-opacity', '0.4');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Bar
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', barHeight);
    rect.setAttribute('fill', `url(#barGradient-${index})`);
    rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
    rect.setAttribute('stroke-width', 1);
    rect.setAttribute('rx', 8);
    rect.style.cursor = 'pointer';
    rect.style.transition = 'all 0.3s ease';
    
    rect.addEventListener('mouseenter', () => {
      rect.setAttribute('opacity', '0.8');
      rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.4)');
      showBarTooltip(d, x + barWidth / 2, y, container);
    });
    
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('opacity', '1');
      rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
      hideTooltip();
    });
    
    chartGroup.appendChild(rect);

    // Value label on top of bar
    const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valueText.setAttribute('x', x + barWidth / 2);
    valueText.setAttribute('y', y - 8);
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('font-family', 'Inter, Arial, sans-serif');
    valueText.setAttribute('font-size', '14');
    valueText.setAttribute('font-weight', 'bold');
    valueText.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
    valueText.textContent = d.count;
    chartGroup.appendChild(valueText);

    // Category label
    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', x + barWidth / 2);
    labelText.setAttribute('y', chartHeight + 25);
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('font-family', 'Inter, Arial, sans-serif');
    labelText.setAttribute('font-size', '14');
    labelText.setAttribute('font-weight', '500');
    labelText.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
    labelText.textContent = d.label;
    chartGroup.appendChild(labelText);
  });

  // Add axes with improved styling
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', 0);
  xAxis.setAttribute('x2', chartWidth);
  xAxis.setAttribute('y1', chartHeight);
  xAxis.setAttribute('y2', chartHeight);
  xAxis.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  xAxis.setAttribute('stroke-width', 2);
  chartGroup.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', 0);
  yAxis.setAttribute('x2', 0);
  yAxis.setAttribute('y1', 0);
  yAxis.setAttribute('y2', chartHeight);
  yAxis.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  yAxis.setAttribute('stroke-width', 2);
  chartGroup.appendChild(yAxis);

  container.appendChild(svg);
}

function createArcPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
  const x1 = centerX + outerRadius * Math.cos(startAngle);
  const y1 = centerY + outerRadius * Math.sin(startAngle);
  const x2 = centerX + outerRadius * Math.cos(endAngle);
  const y2 = centerY + outerRadius * Math.sin(endAngle);
  
  const x3 = centerX + innerRadius * Math.cos(endAngle);
  const y3 = centerY + innerRadius * Math.sin(endAngle);
  const x4 = centerX + innerRadius * Math.cos(startAngle);
  const y4 = centerY + innerRadius * Math.sin(startAngle);
  
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  
  let path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
  
  if (innerRadius > 0) {
    path += ` L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  } else {
    path += ` L ${centerX} ${centerY} Z`;
  }
  
  return path;
}

function createLegend(container, data) {
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

  data.forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    legendItem.innerHTML = `
      <div style="width: 16px; height: 16px; background: ${item.color}; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500; font-size: 0.9rem;">${item.label}: ${item.percentage.toFixed(1)}%</span>
    `;
    legend.appendChild(legendItem);
  });

  container.appendChild(legend);
}

let currentTooltip = null;

function showSliceTooltip(data, centerX, centerY, radius, container) {
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
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  `;
  
  tooltip.innerHTML = `
    <div style="margin-bottom: 4px;"><strong style="color: ${data.color};">${data.label}</strong></div>
    <div>Count: ${data.count} projects</div>
    <div>Percentage: ${data.percentage.toFixed(1)}%</div>
  `;
  
  container.style.position = 'relative';
  container.appendChild(tooltip);
  
  tooltip.style.left = `${centerX}px`;
  tooltip.style.top = `${centerY - radius - 60}px`;
  tooltip.style.transform = 'translateX(-50%)';
  
  currentTooltip = tooltip;
}

function showBarTooltip(data, x, y, container) {
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
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  `;
  
  tooltip.innerHTML = `
    <div style="margin-bottom: 4px;"><strong style="color: ${data.color};">${data.label}</strong></div>
    <div>Count: ${data.count} projects</div>
    <div>Percentage: ${data.percentage.toFixed(1)}%</div>
  `;
  
  container.style.position = 'relative';
  container.appendChild(tooltip);
  
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y - 20}px`;
  tooltip.style.transform = 'translateX(-50%)';
  
  currentTooltip = tooltip;
}

function hideTooltip() {
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
}

// Export the main function
export default createGradesChart;
