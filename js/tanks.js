// Graphical Tank Visualizers & SVG Animation Engine

class TankRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  renderAll(tanks) {
    if (!this.container) return;
    this.container.innerHTML = "";

    tanks.forEach(tank => {
      const card = document.createElement("div");
      card.className = "tank-card";
      card.id = `card-${tank.id}`;

      if (tank.type === "propane") {
        card.innerHTML = this.getPropaneTankHTML(tank);
      } else {
        card.innerHTML = this.getGasolineTankHTML(tank);
      }

      this.container.appendChild(card);
    });
  }

  getFillPercentage(tank) {
    return Math.max(0, Math.min(100, (tank.currentStock / tank.capacity) * 100));
  }

  getStatus(tank) {
    const pct = this.getFillPercentage(tank);
    const safeMinPct = (tank.safeMinimum / tank.capacity) * 100;
    
    if (tank.currentStock <= tank.safeMinimum || pct <= 10) {
      return { key: "tankStatusCritical", class: "status-critical", label: "Critical" };
    }
    if (pct <= (tank.warningPercentage || 20)) {
      return { key: "tankStatusLow", class: "status-warning", label: "Low Stock" };
    }
    return { key: "tankStatusNormal", class: "status-normal", label: "Optimal" };
  }

  getGasolineTankHTML(tank) {
    const pct = this.getFillPercentage(tank);
    const status = this.getStatus(tank);
    const fillHeight = (pct / 100) * 140; // Max fill height is 140px out of 160px height
    const safeMinY = 170 - ((tank.safeMinimum / tank.capacity) * 140);
    const lang = window.stationApp ? window.stationApp.currentLang : "en";
    const t = translations[lang] || translations.en;

    const fuelName = t[tank.fuelGrade] || tank.name;

    return `
      <div class="tank-header">
        <div>
          <span class="tank-title">${tank.name}</span>
          <span class="tank-fuel-badge" style="background-color: ${tank.color}22; color: ${tank.color}; border: 1px solid ${tank.color}66;">
            ${fuelName}
          </span>
        </div>
        <span class="tank-status-pill ${status.class}" data-i18n="${status.key}">${t[status.key] || status.label}</span>
      </div>

      <div class="tank-visual-container vertical-tank">
        <svg viewBox="0 0 160 210" class="tank-svg">
          <defs>
            <linearGradient id="metalGrad-${tank.id}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="25%" stop-color="#334155"/>
              <stop offset="70%" stop-color="#1e293b"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="liquidGrad-${tank.id}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="${tank.color}"/>
              <stop offset="100%" stop-color="${tank.color}aa"/>
            </linearGradient>
            <clipPath id="tankClip-${tank.id}">
              <rect x="25" y="30" width="110" height="150" rx="14" ry="14" />
            </clipPath>
          </defs>

          <!-- Tank Outer Shell / Dome -->
          <rect x="23" y="28" width="114" height="154" rx="16" ry="16" fill="url(#metalGrad-${tank.id})" stroke="#475569" stroke-width="2"/>
          
          <!-- Glass Sight Gauge Window -->
          <g clip-path="url(#tankClip-${tank.id})">
            <!-- Background inside -->
            <rect x="25" y="30" width="110" height="150" fill="#090d16" opacity="0.85"/>
            
            <!-- Liquid Fill with Wave -->
            <rect x="25" y="${180 - fillHeight}" width="110" height="${fillHeight + 10}" fill="url(#liquidGrad-${tank.id})" opacity="0.88" class="liquid-rect"/>
            
            <!-- Animated fluid wave crest -->
            <path class="wave-path" fill="${tank.waveColor}" d="M25,${180 - fillHeight} Q52,${176 - fillHeight} 80,${180 - fillHeight} T135,${180 - fillHeight} L135,${185 - fillHeight} L25,${185 - fillHeight} Z" />

            <!-- Ruler markings / Tick lines -->
            <line x1="28" y1="45" x2="38" y2="45" stroke="#94a3b8" stroke-width="1.5" opacity="0.6"/>
            <text x="42" y="48" fill="#94a3b8" font-size="8" font-family="monospace">100%</text>

            <line x1="28" y1="82" x2="35" y2="82" stroke="#94a3b8" stroke-width="1" opacity="0.6"/>
            <text x="39" y="85" fill="#94a3b8" font-size="8" font-family="monospace">75%</text>

            <line x1="28" y1="110" x2="38" y2="110" stroke="#94a3b8" stroke-width="1.5" opacity="0.6"/>
            <text x="42" y="113" fill="#94a3b8" font-size="8" font-family="monospace">50%</text>

            <line x1="28" y1="145" x2="35" y2="145" stroke="#94a3b8" stroke-width="1" opacity="0.6"/>
            <text x="39" y="148" fill="#94a3b8" font-size="8" font-family="monospace">25%</text>

            <!-- Safe Minimum Line -->
            <line x1="25" y1="${safeMinY}" x2="135" y2="${safeMinY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3" />
          </g>

          <!-- Tank Structural Ribs and Metallic Highlight -->
          <rect x="23" y="28" width="114" height="154" rx="16" ry="16" fill="none" stroke="#64748b" stroke-width="1.5" opacity="0.4"/>
          <line x1="38" y1="30" x2="38" y2="180" stroke="#ffffff" stroke-width="2" opacity="0.15"/>

          <!-- Manhole and Top Flange -->
          <ellipse cx="80" cy="28" rx="20" ry="5" fill="#475569" stroke="#94a3b8" stroke-width="1.5"/>
          <rect x="76" y="20" width="8" height="8" fill="#334155"/>

          <!-- Tank Concrete Foundation / Supports -->
          <rect x="35" y="184" width="22" height="14" fill="#334155" rx="2"/>
          <rect x="103" y="184" width="22" height="14" fill="#334155" rx="2"/>
          <rect x="20" y="198" width="120" height="6" fill="#1e293b" rx="2"/>
        </svg>

        <!-- Live Tank Metrics Panel -->
        <div class="tank-metric-overlay">
          <div class="metric-percentage" style="color: ${tank.color};">${pct.toFixed(1)}%</div>
          <div class="metric-volume">
            <strong>${tank.currentStock.toLocaleString()}</strong> <span class="metric-unit">L</span>
          </div>
          <div class="metric-sub">
            <span data-i18n="tankCapacity">${t.tankCapacity}:</span> ${tank.capacity.toLocaleString()} L
          </div>
        </div>
      </div>

      <div class="tank-footer-metrics">
        <div class="footer-chip">
          <span class="chip-label" data-i18n="tankSafeMin">${t.tankSafeMin}</span>
          <span class="chip-val">${tank.safeMinimum.toLocaleString()} L</span>
        </div>
        <div class="footer-chip">
          <span class="chip-label" data-i18n="tankTemp">${t.tankTemp}</span>
          <span class="chip-val">${tank.temperature || 15.0}°C</span>
        </div>
      </div>

      <div class="tank-actions">
        <button class="btn btn-sm btn-outline" onclick="window.stationApp.openCalibration('${tank.id}')">
          ⚙️ <span data-i18n="btnCalibrate">${t.btnCalibrate}</span>
        </button>
        <button class="btn btn-sm btn-primary" onclick="window.stationApp.openQuickInflow('${tank.id}')">
          📥 <span data-i18n="btnQuickRefill">${t.btnQuickRefill}</span>
        </button>
      </div>
    `;
  }

  getPropaneTankHTML(tank) {
    const pct = this.getFillPercentage(tank);
    const status = this.getStatus(tank);
    const fillWidth = (pct / 100) * 160; // Horizontal fill width
    const lang = window.stationApp ? window.stationApp.currentLang : "en";
    const t = translations[lang] || translations.en;
    const fuelName = t[tank.fuelGrade] || tank.name;

    // Pressure dial calculation: normal 4 - 12 bar, warning 12-14, danger 14-16
    const pressure = tank.pressure || 8.5;
    const maxP = tank.maxPressure || 16.0;
    // Map pressure 0..16 bar to angle -120 deg to +120 deg
    const angle = Math.min(120, Math.max(-120, ((pressure / maxP) * 240) - 120));

    return `
      <div class="tank-header">
        <div>
          <span class="tank-title">${tank.name}</span>
          <span class="tank-fuel-badge" style="background-color: ${tank.color}22; color: ${tank.color}; border: 1px solid ${tank.color}66;">
            ${fuelName} (LPG/SNG)
          </span>
        </div>
        <span class="tank-status-pill ${status.class}" data-i18n="${status.key}">${t[status.key] || status.label}</span>
      </div>

      <div class="tank-visual-container horizontal-tank">
        <svg viewBox="0 0 240 160" class="tank-svg">
          <defs>
            <linearGradient id="lpgMetalGrad-${tank.id}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#475569"/>
              <stop offset="35%" stop-color="#64748b"/>
              <stop offset="70%" stop-color="#334155"/>
              <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>
            <linearGradient id="lpgLiquidGrad-${tank.id}" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0891b2"/>
              <stop offset="100%" stop-color="#22d3ee"/>
            </linearGradient>
            <clipPath id="lpgBulletClip-${tank.id}">
              <!-- Dished elliptical bullet tank body -->
              <rect x="25" y="42" width="190" height="74" rx="37" ry="37" />
            </clipPath>
          </defs>

          <!-- Steel Saddles / Supports -->
          <polygon points="50,110 40,146 72,146 66,110" fill="#334155" stroke="#475569"/>
          <polygon points="174,110 168,146 200,146 190,110" fill="#334155" stroke="#475569"/>
          <rect x="30" y="146" width="180" height="6" fill="#1e293b" rx="2"/>

          <!-- Propane Vessel Main Outer Hull -->
          <rect x="23" y="40" width="194" height="78" rx="39" ry="39" fill="url(#lpgMetalGrad-${tank.id})" stroke="#94a3b8" stroke-width="2.5"/>

          <!-- Liquid Gauge / Sight Chamber Window -->
          <g clip-path="url(#lpgBulletClip-${tank.id})">
            <rect x="25" y="42" width="190" height="74" fill="#0b1329"/>
            
            <!-- Horizontal fill level -->
            <rect x="25" y="${116 - (pct / 100) * 74}" width="190" height="${(pct / 100) * 74 + 10}" fill="url(#lpgLiquidGrad-${tank.id})" opacity="0.85"/>
            
            <!-- Liquefied Gas Wave Path -->
            <path class="wave-path" fill="rgba(6, 182, 212, 0.45)" d="M25,${116 - (pct / 100) * 74} Q72,${112 - (pct / 100) * 74} 120,${116 - (pct / 100) * 74} T215,${116 - (pct / 100) * 74} L215,${120} L25,${120} Z" />

            <!-- Grid Level Lines -->
            <line x1="25" y1="60" x2="215" y2="60" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,4" opacity="0.25"/>
            <line x1="25" y1="79" x2="215" y2="79" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,4" opacity="0.25"/>
            <line x1="25" y1="98" x2="215" y2="98" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,4" opacity="0.25"/>
          </g>

          <!-- Top Gas Nozzle Dome, Relief Valve & Pressure Dial Assembly -->
          <rect x="110" y="24" width="20" height="18" fill="#475569" stroke="#64748b" stroke-width="1"/>
          <line x1="120" y1="16" x2="120" y2="24" stroke="#94a3b8" stroke-width="3"/>
          <circle cx="120" cy="14" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1"/> <!-- Safety Relief Valve -->

          <!-- Mini Pressure Gauge Dial On Vessel -->
          <g transform="translate(185, 24)">
            <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
            <!-- Gauge arc -->
            <path d="M -9,6 A 11,11 0 1,1 9,6" fill="none" stroke="#22c55e" stroke-width="2.5"/>
            <path d="M 6,-9 A 11,11 0 0,1 9,6" fill="none" stroke="#ef4444" stroke-width="2.5"/>
            <!-- Pointer -->
            <line x1="0" y1="0" x2="0" y2="-9" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round" transform="rotate(${angle}, 0, 0)"/>
            <circle cx="0" cy="0" r="2.5" fill="#38bdf8"/>
          </g>

          <text x="185" y="46" fill="#38bdf8" font-size="7" font-weight="bold" text-anchor="middle" font-family="monospace">
            ${pressure.toFixed(1)} bar
          </text>
        </svg>

        <!-- Live Metrics Overlay -->
        <div class="tank-metric-overlay">
          <div class="metric-percentage" style="color: ${tank.color};">${pct.toFixed(1)}%</div>
          <div class="metric-volume">
            <strong>${tank.currentStock.toLocaleString()}</strong> <span class="metric-unit">L</span>
          </div>
          <div class="metric-sub">
            <span data-i18n="tankCapacity">${t.tankCapacity}:</span> ${tank.capacity.toLocaleString()} L
          </div>
        </div>
      </div>

      <div class="tank-footer-metrics">
        <div class="footer-chip">
          <span class="chip-label" data-i18n="tankPressure">${t.tankPressure}</span>
          <span class="chip-val" style="color: #38bdf8; font-weight: bold;">⚡ ${pressure.toFixed(1)} bar</span>
        </div>
        <div class="footer-chip">
          <span class="chip-label" data-i18n="tankTemp">${t.tankTemp}</span>
          <span class="chip-val">${tank.temperature || 14.0}°C</span>
        </div>
        <div class="footer-chip">
          <span class="chip-label" data-i18n="tankSafeMin">${t.tankSafeMin}</span>
          <span class="chip-val">${tank.safeMinimum.toLocaleString()} L</span>
        </div>
      </div>

      <div class="tank-actions">
        <button class="btn btn-sm btn-outline" onclick="window.stationApp.openCalibration('${tank.id}')">
          ⚙️ <span data-i18n="btnCalibrate">${t.btnCalibrate}</span>
        </button>
        <button class="btn btn-sm btn-primary" onclick="window.stationApp.openQuickInflow('${tank.id}')">
          📥 <span data-i18n="btnQuickRefill">${t.btnQuickRefill}</span>
        </button>
      </div>
    `;
  }
}

window.TankRenderer = TankRenderer;

