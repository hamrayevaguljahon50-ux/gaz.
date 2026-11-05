# PetroFlow - Multilingual Fuel & Gas Filling Station Monitoring System

A comprehensive, client-side monitoring and inventory management system for filling stations handling both **Gasoline** (AI-80, AI-92, AI-95) and **Propane Gas (LPG / Liquefied Petroleum Gas)**.

Built with **JavaScript, CSS, HTML, and Python**, requiring **no server-side Python backend** to run.

---

## 🌟 Key Features

1. **Multilingual Support (EN, RU, UZ)**
   - **English (EN)**: Full international petroleum terminal terminology.
   - **Russian (RU)**: Industry-standard АЗС / АГЗС terminology (ТРК, ГРК, ТТН, СПБТ, метрошток).
   - **Uzbek (UZ - Latin)**: Standard terminology used at filling stations across Uzbekistan (YQSh, hisoblagich, sisterna, propan gazi, tahlil).
   - Instant language switching directly from the top navigation bar with persistent preference saving.

2. **Both Gasoline & Propane Gas (LPG) Tracking**
   - **Gasoline Tanks**: Atmospheric storage tanks with volume in Liters, density, temperature, safe minimum, and dead stock indicators.
   - **Propane Gas (LPG)**: Pressurized storage bullet vessels with liquid volume in Liters, mass in kilograms, tanker pressure in **bar**, temperature in **°C**, and visual pressure dials.

3. **Accurate Tracking of Inflows, Outflows & Current Stock**
   - **Deliveries (Inflows)**: Manual registration of road tanker deliveries, refinery suppliers, waybill / invoice numbers (TTN), truck license plates, and quality certificates.
   - **Sales (Outflows)**: Manual registration of dispenser dispensing, pump numbers, start/end totalizer meter readings (with automatic volume calculation: $V = \text{Meter}_{\text{End}} - \text{Meter}_{\text{Start}}$), and cashier/attendant shifts.
   - **Live Stock Calculations**: Real-time inventory balance ($\text{Stock} = \text{Initial} + \sum \text{Inflows} - \sum \text{Outflows}$) with automated warning when dropping below safety thresholds.

4. **Graphical Design & Interactive Tank Visualizers**
   - **Vertical Cylindrical Tanks (Gasoline)**: Real-time SVG fluid level gauges with wave crest animations, graduation markings (25%, 50%, 75%, 100%), safe minimum indicator lines, and fill percentage pills.
   - **Horizontal Bullet Pressure Vessels (Propane)**: Ellipsoidal heads, steel saddle supports, safety relief valve, and an integrated **working pressure gauge dial** with color-coded safety zones.
   - **Interactive Charts**: Pure HTML5 Canvas charts showing 7-day inflow vs. outflow volume comparisons and stock distribution donuts.

5. **Gmail Integration**
   - **1-Click Open in Gmail Web**: Directly opens `mail.google.com` in your browser with the recipient (station manager), CC (supervisor), structured subject, and full shift/inventory breakdown pre-filled without requiring any server.
   - **Mailto & Clipboard Support**: Instant export to native email clients or clipboard.
   - **Automated Python Gmail Dispatch**: Companion `gmail_notifier.py` and `fuel_station_manager.py` using standard `smtplib` for automated background dispatch via cron/schedulers.

6. **Python Engine (Client-Side & Standalone CLI)**
   - **In-Browser Python (Pyodide)**: Run Python statistical regressions, depletion forecasting, mass balance checks, and audit scripts directly in your browser with no backend required!
   - **Standalone Python CLI (`fuel_station_manager.py`)**: Terminal dashboard with interactive menus for managing stock offline.

---

## 📁 Project Structure

```
├── index.html                   # Master single-page dashboard application
├── style.css                    # Industrial cyber-modern styling, responsive layout & SVG animations
├── js/
│   ├── translations.js          # Multilingual dictionary (English, Russian, Uzbek)
│   ├── data.js                  # State management, local storage, calculations, CSV/JSON export
│   ├── tanks.js                 # SVG tank renderers (vertical cylinder & horizontal LPG bullet)
│   ├── charts.js                # HTML5 Canvas 7-day balance & distribution charts
│   ├── gmail.js                 # Gmail shift report composer and URL builder
│   ├── python-runner.js         # In-browser Python WASM runner & audit logic
│   └── app.js                   # Application controller, navigation, forms & event bindings
├── fuel_station_manager.py      # Standalone Python CLI manager & audit tool
├── gmail_notifier.py            # Standalone Python Gmail SMTP email dispatcher
└── README.md                    # System documentation
```

---

## 🚀 How to Run

### Method 1: Web Dashboard (No Server Required)
Simply double-click or open `index.html` in any web browser (Chrome, Edge, Firefox, Safari):
```bash
# Windows
start index.html

# Or simply open index.html in your browser
```
All fuel balance tracking, calculations, SVG visualizations, language switching, and local storage run 100% on the client side!

### Method 2: Standalone Python CLI
You can also run the Python management engine in your terminal:
```bash
python fuel_station_manager.py
```
This provides an interactive terminal interface to record deliveries and sales, view inventory balances, and trigger automated Gmail alerts.

### Method 3: Automated Gmail SMTP Dispatching (Python)
To dispatch background emails through Python's `smtplib`:
```bash
# Set your Gmail credentials (use Google App Password)
export GMAIL_SENDER="yourstation@gmail.com"
export GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

python gmail_notifier.py
```

---

## 🌐 Multilingual Translation Overview

| Feature / Term | English (EN) | Russian (RU) | Uzbek (UZ) |
|---|---|---|---|
| Station Monitor | Station Monitor | Мониторинг АЗС/АГЗС | YQSh Monitoringi |
| Gasoline | Gasoline (AI-92, AI-95, AI-80) | Бензин (АИ-92, АИ-95, АИ-80) | Benzin (AI-92, AI-95, AI-80) |
| Propane (LPG) | Propane Gas (LPG) | Сжиженный газ Пропан (СУГ/СПБТ) | Propan gazi (SNG) |
| Inflow (Delivery) | Inflows (Deliveries) | Приход (Поставки) | Kirim (Yetkazib berish) |
| Outflow (Sales) | Outflows (Sales) | Расход (Продажи) | Chiqim (Sotuv/Sarf) |
| Tank Capacity | Capacity | Номинальный объём | Nominal sig'im |
| Current Stock | Current Volume | Фактический объём | Amaldagi joriy qoldiq |
| Gas Pressure | Gas Pressure (bar) | Давление газа (бар) | Gaz bosimi (bar) |
| Safe Minimum | Safe Minimum | Неснижаемый остаток | Xavfsiz minimum |
| Shift Report | Shift Report | Сменный отчёт | Smena hisoboti |
| Send via Gmail | Send Gmail Report | Отчёт через Gmail | Gmail hisoboti |

---

## ✉️ Gmail Integration Details

The system provides multiple ways to send reports:
1. **Direct Web Launch (Zero Setup)**: Clicking **"Open in Gmail Web (1-Click)"** constructs a pre-formatted Gmail URL with recipient, subject, and detailed metrics (tanks, deliveries, sales, alerts) and opens it directly in Gmail Web Composer.
2. **Local Email Client**: Clicking **"Default Email Client"** invokes `mailto:`.
3. **Copy to Clipboard**: Copies the entire formatted report with one click.
4. **Python Automated Dispatch**: Using `gmail_notifier.py` with standard `smtplib.SMTP_SSL`.

---

## 🔒 Data Persistence & Portability
- All data is saved automatically to the browser's `localStorage`.
- You can export your data at any time via **Export CSV** (for Excel/audits) or **Backup Data (JSON)** under the Analytics tab.
- Data can be restored on another device using **Restore Backup**.

