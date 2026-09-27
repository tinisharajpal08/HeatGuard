# HEATGUARD — AI-Powered Hyperlocal Heat-Health Early Warning & Action System

> **SIH Problem Statement Solution**: Shifting heatwave forecasting from *"WHAT WILL THE WEATHER BE?"* to *"WHAT WILL THE WEATHER DO TO PEOPLE?"*

HEATGUARD is a production-grade, AI-powered hyperlocal heat-health decision-support platform built for Indian municipalities and healthcare authorities (demonstrated on the 25 municipal wards of Delhi/NCR). By combining micro-meteorological variables, established human thermal stress indices (Heat Index, WBGT, UTCI), demographic vulnerability factors (elderly %, outdoor workers %, pop density, UHI built-up index), and ML-based health risk prediction models, HEATGUARD provides 3–5 day hyperlocal heat-health risk warnings and automated intervention recommendations.

---

## Key Features & Highlights

1. **Hyperlocal GIS Risk Map**: Interactive Leaflet GIS map displaying Delhi ward boundaries with dynamic color coding (`GREEN`, `YELLOW`, `ORANGE`, `RED`, `PURPLE`), hover tooltips, date forecasting, and switchable risk layers.
2. **Scientifically Validated Thermal Engines**:
   - **Heat Index (HI)**: Rothfusz regression equation with range adjustments.
   - **WBGT (Wet-Bulb Globe Temperature)**: Outdoor direct solar radiation ($0.7 T_{nw} + 0.2 T_g + 0.1 T_d$) and indoor shade ($0.7 T_{nw} + 0.3 T_g$) models based on Liljegren & BOM algorithms.
   - **UTCI (Universal Thermal Climate Index)**: 6-variable operational polynomial procedure approximation.
   - **Human Thermal Stress Score (HTSS)**: Clearly labeled derived composite metric ($0-100$ scale) combining HI, WBGT, UTCI, duration, and UHI intensity.
3. **Data Provenance & Transparency**: Every metric across the application displays a Data Provenance tag (`REAL`, `DERIVED`, `ESTIMATED`, `SYNTHETIC/DEMO`).
4. **Explainable AI (XAI)**: "Why is this area red?" natural language SHAP-like attribution breakdown explaining the exact feature contributions for every ward.
5. **Decision Support & Action Engines**:
   - **Cooling Centre Optimizer**: Spatial algorithm scoring grid points to recommend optimal new cooling shelter locations based on heat risk, vulnerable population, pop density, and distance matrix to existing facilities.
   - **Outdoor Work Scheduler**: Dynamic safe, caution, and restricted work time slots (e.g., safe 6-10 AM, 5-8 PM; restricted 12-4 PM).
   - **Hospital Surge Preparedness**: Hospital bed & ICU capacity tracking, regional ward exposure mapping, and surge pressure forecasting.
   - **Multi-Channel Alert System**: SMS, WhatsApp, Email, and Dashboard alert simulation with full lifecycle tracking (`BROADCASTED`, `ACKNOWLEDGED`, `RESOLVED`).
6. **Multi-Role Command Portals**:
   - **Authority Dashboard**: Command-center KPI summary, high-risk ward list, forecast timeline, active interventions.
   - **Citizen Dashboard**: Simplified public view, danger hour advisory, cooling center finder with distance calculation, and SMS alert signup.
   - **Healthcare Dashboard**: Hospital surge pressure, emergency bed capacity, triage readiness checklists.
   - **Admin & ML Monitoring**: Model evaluation comparison (Random Forest, Gradient Boosting, XGBoost, Logistic Regression), Accuracy, Precision, Recall, F1, ROC-AUC, Feature Importances, retrain trigger.
   - **Historical Analytics**: Multi-year heatwave frequency (2023-2026), peak thermal indices trends.
   - **Forecast vs Actual Tracking**: Model accuracy validation comparing predicted risk vs actual observed HTSS.
7. **SIH Judging Demo / Simulation Mode**: Interactive scenario switcher in header bar (`Normal Summer`, `Heatwave`, `Extreme Heatwave`) with real-time recalculations across all 25 wards.

---

## Project Architecture

```
HEATGUARD/
├── data/
│   ├── README.md                      # Data provenance & dataset specification
│   ├── generate_delhi_dataset.py      # Reproducible dataset generator script
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & router registration
│   │   ├── database.py                # SQLAlchemy SQLite configuration
│   │   ├── models.py                  # Database ORM models
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   ├── heatguard.db               # Pre-seeded SQLite database
│   │   ├── engine/
│   │   │   ├── thermal.py             # Scientific HI, WBGT, UTCI, HTSS, XAI engine
│   │   │   ├── ml_pipeline.py         # ML training, evaluation & metrics engine
│   │   │   ├── cooling_optimizer.py   # Spatial cooling center optimizer
│   │   │   ├── work_scheduler.py      # Outdoor work safe scheduler
│   │   │   ├── simulation.py          # Demo scenario switcher engine
│   │   ├── api/                       # API router endpoints
│   │   │   ├── weather.py, wards.py, risk.py, alerts.py, interventions.py
│   │   │   ├── cooling.py, hospitals.py, tracking.py, analytics.py, admin.py, simulation.py
├── frontend/
│   ├── src/
│   │   ├── components/                # React dashboard components
│   │   │   ├── Header.tsx, LandingPage.tsx, AuthorityDashboard.tsx, GisMap.tsx
│   │   │   ├── WardDetailModal.tsx, CitizenDashboard.tsx, HealthcareDashboard.tsx
│   │   │   ├── HistoricalAnalytics.tsx, AlertsAndTracking.tsx, AdminMonitoring.tsx
│   │   │   ├── DataProvenanceView.tsx
│   │   ├── App.tsx, index.css, main.tsx
│   ├── vite.config.ts, package.json
```

---

## How to Run locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm 9+

### 1. Database & ML Initialization (Pre-seeded out-of-the-box)
```bash
# Generate SQLite database pre-seeded with Delhi ward weather & demographics
python data/generate_delhi_dataset.py

# Train ML models and generate evaluation metrics
python backend/app/engine/ml_pipeline.py
```

### 2. Start Backend API Server
```bash
# Start FastAPI backend at http://127.0.0.1:8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API Swagger Docs: `http://127.0.0.1:8000/docs`

### 3. Start Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Access Frontend App at: `http://localhost:3000`

### Deploy on Render

This repository is a monorepo with separate Render services defined in `render.yaml`:

- **Backend Web Service**: root directory `backend`; build command `pip install -r requirements.txt`; start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Frontend Static Site**: root directory `frontend`; build command `npm ci && npm run build`; publish directory `dist`; no start command.

Set `VITE_API_BASE_URL` to the backend service URL. The map works without a CARTO credential by using public OpenStreetMap tiles; optionally set `VITE_CARTO_API_KEY` on the frontend service to use CARTO Dark Matter tiles. Optional backend variables are `IMD_API_KEY`, `IMD_API_URL`, and `ERA5_DATA_DIR`.

### Deploy the frontend on Netlify

The repository includes a root-level `netlify.toml` configured for the Vite app in `frontend/`. Connect the repository to Netlify and deploy with the detected settings; the configuration builds the frontend and serves `dist/` with a single-page-app fallback.

The FastAPI backend must be deployed separately because Netlify hosts the static frontend, not this persistent Python API. For example, deploy the backend using the Backend Web Service in `render.yaml`, then add the following in **Netlify → Site configuration → Environment variables**:

- `VITE_API_BASE_URL`: the deployed backend's public URL (for example, `https://your-heatguard-api.onrender.com`).
- `VITE_CARTO_API_KEY` (optional): a CARTO API key for Dark Matter map tiles.

`VITE_API_BASE_URL` is embedded into the frontend at build time, so trigger a new deploy after changing it. For local development, leave it empty to use the Vite proxy.

---

## Interactive Judging Scenario Instructions

To demonstrate HEATGUARD's end-to-end real-time response during SIH judging:

1. Open `http://localhost:3000`.
2. Locate the **SIH JUDGING DEMO** switcher bar at the top right of the header.
3. Toggle between:
   - **`Normal Summer`**: Temperatures ~33-34°C, low risk levels across wards.
   - **`Heatwave`**: Temperatures ~41-42°C, WBGT ~32°C, high risk wards highlighted in orange/red.
   - **`Extreme Heatwave`**: Temperatures spike to 46.2°C+, humidity surge, WBGT &gt;35°C, HTSS score &gt;88/100, purple/red high threat wards, automatic alert triggers, updated hospital surge pressure, and cooling center recommendations.

---

## Data Provenance Policy

| Metric | Source | Provenance Level |
|---|---|---|
| Temperature & Humidity | IMD / ERA5 Reanalysis Proxy | `REAL` |
| Population & Demographics | Census of India 2011 / Projections | `REAL` |
| Heat Index (HI) | NWS Rothfusz Formula | `DERIVED` |
| Outdoor WBGT & UTCI | Liljegren / BOM / Polynomial Models | `ESTIMATED` |
| Human Thermal Stress (HTSS) | HEATGUARD Composite Risk Score | `DERIVED` |
| Health Surge & Hospital Spikes | Epidemiological Response Calibration | `SYNTHETIC/DEMO` |
