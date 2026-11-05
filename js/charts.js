// Station Analytics & Visual Charts Engine (Pure HTML5 Canvas & SVG - 100% Offline Reliable)

class StationCharts {
  constructor() {
    this.balanceCanvas = document.getElementById("canvasBalanceChart");
    this.distributionCanvas = document.getElementById("canvasDistributionChart");
  }

  renderAll() {
    this.renderBalanceChart();
    this.renderDistributionChart();
    this.updateStatsCards();
  }

  renderBalanceChart() {
    if (!this.balanceCanvas) return;
    const ctx = this.balanceCanvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = this.balanceCanvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 260;

    this.balanceCanvas.width = width * dpr;
    this.balanceCanvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const { labels, inflowsData, outflowsData } = window.stationData.get7DayTrends();
    const padding = { top: 30, right: 30, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(1000, ...inflowsData, ...outflowsData) * 1.15;

    // Draw grid lines
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${(val / 1000).toFixed(1)}k L`, padding.left - 8, y + 4);
    }
    ctx.setLineDash([]);

    // Draw grouped bars
    const barGroupWidth = chartW / labels.length;
    const barWidth = Math.min(22, (barGroupWidth - 16) / 2);

    labels.forEach((label, idx) => {
      const groupX = padding.left + idx * barGroupWidth + (barGroupWidth / 2);

      // Inflow Bar (Green/Emerald)
      const inVal = inflowsData[idx];
      const inH = (inVal / maxVal) * chartH;
      const inX = groupX - barWidth - 3;
      const inY = padding.top + chartH - inH;

      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.roundRect(inX, inY, barWidth, inH, [4, 4, 0, 0]);
      ctx.fill();

      // Outflow Bar (Amber/Orange)
      const outVal = outflowsData[idx];
      const outH = (outVal / maxVal) * chartH;
      const outX = groupX + 3;
      const outY = padding.top + chartH - outH;

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(outX, outY, barWidth, outH, [4, 4, 0, 0]);
      ctx.fill();

      // X Label
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, groupX, height - 12);
    });

    // Legend
    const legendX = width - padding.right - 180;
    const legendY = 14;

    ctx.fillStyle = "#10b981";
    ctx.fillRect(legendX, legendY, 12, 12);
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("Inflow (Deliveries)", legendX + 16, legendY + 10);

    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(legendX + 90, legendY, 12, 12);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("Outflow (Sales)", legendX + 106, legendY + 10);
  }

  renderDistributionChart() {
    if (!this.distributionCanvas) return;
    const ctx = this.distributionCanvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = this.distributionCanvas.getBoundingClientRect();
    const width = rect.width || 380;
    const height = 260;

    this.distributionCanvas.width = width * dpr;
    this.distributionCanvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const tanks = window.stationData.tanks;
    const total = tanks.reduce((sum, t) => sum + t.currentStock, 0);

    if (total === 0) return;

    const centerX = width * 0.35;
    const centerY = height / 2;
    const outerRadius = 80;
    const innerRadius = 50;

    let startAngle = -Math.PI / 2;

    const lang = window.stationApp ? window.stationApp.currentLang : "en";
    const t = translations[lang] || translations.en;

    tanks.forEach((tank, idx) => {
      const sliceAngle = (tank.currentStock / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = tank.color;
      ctx.fill();

      // Legend entry on right
      const legY = 45 + idx * 36;
      ctx.fillStyle = tank.color;
      ctx.fillRect(width * 0.62, legY, 12, 12);

      const fuelName = t[tank.fuelGrade] || tank.name;
      const pct = ((tank.currentStock / total) * 100).toFixed(1);

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${fuelName}`, width * 0.62 + 18, legY + 8);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`${tank.currentStock.toLocaleString()} L (${pct}%)`, width * 0.62 + 18, legY + 22);

      startAngle = endAngle;
    });

    // Center total label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TOTAL STOCK", centerX, centerY - 6);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText(`${(total / 1000).toFixed(1)}k L`, centerX, centerY + 14);
  }

  updateStatsCards() {
    const outflows = window.stationData.outflows;
    const tanks = window.stationData.tanks;
    const totalStock = tanks.reduce((sum, t) => sum + t.currentStock, 0);

    // Calculate average daily outflow from history (or default 6,500 L)
    let avgDaily = 6500;
    if (outflows.length > 0) {
      const totalOutflowVol = outflows.reduce((s, o) => s + o.volume, 0);
      avgDaily = Math.round(totalOutflowVol / Math.max(1, Math.min(7, outflows.length)));
    }

    const estDays = avgDaily > 0 ? (totalStock / avgDaily).toFixed(1) : "N/A";
    const turnoverCycle = avgDaily > 0 ? `${(totalStock / (avgDaily * 30)).toFixed(1)} mo` : "N/A";

    const elAvg = document.getElementById("statAvgDailyValue");
    const elDays = document.getElementById("statDaysValue");
    const elTurnover = document.getElementById("statTurnoverValue");

    if (elAvg) elAvg.innerText = `${avgDaily.toLocaleString()} L/day`;
    if (elDays) elDays.innerText = `${estDays} Days`;
    if (elTurnover) elTurnover.innerText = turnoverCycle;
  }
}

window.StationCharts = StationCharts;

