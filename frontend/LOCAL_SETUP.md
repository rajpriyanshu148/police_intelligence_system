# AIPAS Frontend Local Setup Guide

This guide provides instructions for setting up, running, testing, and developing the React 19 / Vite frontend application locally.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **FastAPI Backend Server**: Running locally at `http://localhost:8000` (or configure via `.env.development`)

---

## Initial Installation

Clone the repository and navigate to the frontend directory:

```powershell
cd C:\Users\rajpr\.gemini\antigravity\scratch\police_intelligence_system\frontend
```

Install the dependencies:

```powershell
npm install
```

---

## Running the Application Locally

Start the Vite development server:

```powershell
npm run dev
```

By default, the application will boot at **`http://localhost:5173/`**. 

Vite is configured with a development proxy that automatically redirects requests to `/api` directly to the backend at `http://localhost:8000` to prevent CORS issues.

---

## Testing and Verification

AIPAS Frontend contains a comprehensive Vitest test suite that validates core routers, route guards, API clients, formatters, and UI component render flows.

Run the test suite:

```powershell
npm run test
```

For test coverage reports:

```powershell
npm run coverage
```

---

## Production Build Verification

To compile the application to production-ready assets:

```powershell
npm run build
```

This compiles TypeScript definitions (`tsc -b`) and bundles resources using Rollup under Vite (`vite build`). Compiled assets are output to the `dist/` directory.

To preview the built production assets locally:

```powershell
npm run preview
```
