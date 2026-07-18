# AIPAS — Frontend Application Workspace

Welcome to the frontend application directory for the **AI Police Assistance System (AIPAS)**. 

AIPAS is an enterprise-grade web interface designed for modern police departments, combining state-of-the-art case records registries with real-time AI assistance operations.

---

## Technical Stack Architecture

* **Framework Core**: React 19 (Functional Components, Suspense, Hooks)
* **Build System**: Vite 6, TypeScript 5
* **Data Fetching / Caching**: React Query (TanStack Query v5)
* **Global State Management**: Zustand
* **Telemetry Visualizations**: Recharts
* **Motion & Micro-interactions**: Framer Motion
* **Testing Harness**: Vitest, MSW (Mock Service Worker), React Testing Library

---

## Directory Layout Structure

```
frontend/
├── src/
│   ├── app/                 # SPA Scaffolding, global router entries, AppShell layout
│   ├── assets/              # Static styling, global icons
│   ├── design-system/       # Custom premium UI primitives (Inputs, Display, Layout, Navigation)
│   ├── features/            # Feature-oriented modular domains (cases, complaints, fir, ai, etc.)
│   ├── hooks/               # Global custom React hooks (useAuth, useToast, etc.)
│   ├── lib/                 # Base configurations (Axios clients, API intercepts)
│   ├── services/            # Explicit, fully typed HTTP service layers mapping to FastAPI
│   ├── test/                # Mock Server Worker harness and Vitest configuration suites
│   ├── types/               # Shareable TypeScript interfaces
│   └── utils/               # Formatting, time, and mapping utilities
├── Dockerfile               # Production multi-stage docker compilation configuration
├── nginx.conf               # Enterprise Nginx reverse proxy configuration
└── package.json             # Core dependencies configuration
```

---

## Detailed Documentation Modules

For step-by-step instructions, please read our detailed sub-guides:
1. **Local Setup Guide**: [LOCAL_SETUP.md](file:///C:/Users/rajpr/.gemini/antigravity/scratch/police_intelligence_system/frontend/LOCAL_SETUP.md) — Booting Vite, running tests, and compiling assets.
2. **Environment Variable Specifications**: [ENVIRONMENT.md](file:///C:/Users/rajpr/.gemini/antigravity/scratch/police_intelligence_system/frontend/ENVIRONMENT.md) — Variables and config profiles.
3. **Production Deployment Specifications**: [DEPLOYMENT.md](file:///C:/Users/rajpr/.gemini/antigravity/scratch/police_intelligence_system/frontend/DEPLOYMENT.md) — Docker, docker-compose, and Nginx.
