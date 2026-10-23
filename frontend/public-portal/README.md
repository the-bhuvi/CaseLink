# CASELINK AI — Public Grievance Portal Frontend (Agent 1)

> **CASELINK AI**: An Explainable Cross-Bureau Institution Complaint Monitoring and Coordination System.  
> **Tagline**: *One Institution. Connected Cases. Coordinated Action.*  
> **Prototype Note**: Developed for Smart India Hackathon (SIH26264). This is an academic research prototype and is not an official AICTE or government portal.

---

## 1. Overview & Scope

The Public Grievance Portal (`frontend/public-portal/`) is one of three coordinated applications in the CASELINK AI monorepo. It enables citizens, students, and staff to:
1. **Lodge an institutional grievance** via an accessible, four-step submission wizard (`/submit`).
2. **Obtain an official backend-generated tracking reference** (`CL-YYYY-NNNNN`) with confirmation summary (`/confirmation/:reference`).
3. **Track existing complaint status** with authentication safeguards ensuring private records are visible only to the owning complainant (`/track`).
4. **Access the Complainant Dashboard** (`/my-complaints`) displaying dynamic status metrics, keyword search, status filtering, and dual card/table views.
5. **Inspect public action timelines** (`/my-complaints/:id`) displaying chronological milestones while strictly safeguarding confidential officer notes, internal similarity algorithms, and audit events.
6. **Access FAQs and guidance** (`/help`) explaining grievance routing and data privacy.
7. **Initiate demo authentication** (`/login`) via FastAPI demo login identities (`complainant@demo.caselink`).

---

## 2. Technology Stack

- **Framework**: React 18 with TypeScript in strict mode
- **Bundler**: Vite 6
- **Styling**: Tailwind CSS with custom civic technology design tokens:
  - Navy `#14243A`
  - Blue `#356AE6`
  - Off-white `#F5F7FA`
  - Crisp white surface cards with 8–12px radii (`rounded-xl`)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Server State & Caching**: TanStack Query (React Query v5)
- **Forms & Validation**: React Hook Form with Zod schema validation
- **API Client**: Centralized, typed `fetch` client with bearer token management, error detail parsing, and offline development fallback

---

## 3. Directory Structure

```text
frontend/public-portal/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .env.example
├── .env
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── types/
│   │   ├── api.ts            # API responses, error details, pagination
│   │   ├── auth.ts           # User, UserRole, TokenResponse, DemoLoginRequest
│   │   └── complaint.ts      # CaseResponse, CaseListResponse, TimelineItem, form data
│   ├── lib/
│   │   ├── api-client.ts     # Centralized API client, token handling, mock fallback
│   │   ├── query-client.ts   # TanStack Query configuration
│   │   ├── formatters.ts     # Date formatting, status badges, time-ago
│   │   ├── validation.ts     # Zod validation schemas for all steps & tracking
│   │   └── utils.ts          # Tailwind cn utility
│   ├── context/
│   │   └── AuthContext.tsx   # Complainant session management & token restoration
│   ├── components/
│   │   ├── ui/               # Button, Input, Textarea, Select, Badge, Card, Skeleton, Alert, Toast
│   │   ├── layout/           # Header, Footer, MainLayout
│   │   ├── complaint/        # StatusBadge, ComplaintCard, TimelineView
│   │   ├── forms/            # WizardProgress, StepInstitution, StepDetails, StepSupporting, StepReview
│   │   └── feedback/         # EmptyState, ErrorState, ServiceBanner
│   ├── pages/
│   │   ├── landing/          # LandingPage (Hero, How It Works, Trust & Privacy, CTAs)
│   │   ├── submit/           # SubmitPage (4-step guided grievance wizard)
│   │   ├── confirmation/     # ConfirmationPage (Reference, summary, copy action)
│   │   ├── track/            # TrackPage (Reference lookup with privacy auth check)
│   │   ├── my-complaints/    # MyComplaintsPage (Stats, search, filter, cards/table)
│   │   ├── complaint-detail/ # ComplaintDetailPage (Full public timeline, evidence upload)
│   │   ├── help/             # HelpPage (Categorized accordion FAQs, disclaimer)
│   │   ├── login/            # LoginPage (1-click Demo Complainant sign-in)
│   │   └── not-found/        # NotFoundPage (Branded 404 handler)
│   └── routes/
│       └── AppRoutes.tsx     # Application route definitions
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js `v18+` or `v20+` (tested with Node `v22.20.0`)
- npm `v9+` or `v10+`

### Installation
From the portal root directory:
```bash
cd frontend/public-portal
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000

# Set to true only if developing offline without the FastAPI backend running
VITE_ENABLE_MOCK_FALLBACK=false
```

### Running Locally (Development Mode)
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173/`

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Build output will be bundled in `dist/`.

---

## 5. API Integration Mapping

| Action | HTTP Method & Route | Request Body | Notes |
| :--- | :--- | :--- | :--- |
| **Health Check** | `GET /health` | None | Service heartbeat |
| **Readiness Check** | `GET /api/v1/health/ready` | None | Database and model status |
| **Demo Login** | `POST /api/v1/auth/demo-login` | `{"email": "complainant@demo.caselink", "role": "complainant"}` | Issues short-lived demo JWT |
| **Current User** | `GET /api/v1/auth/me` | None (`Bearer <token>`) | Hydrates session |
| **Submit Complaint** | `POST /api/v1/public/complaints` | `ComplaintCreate` JSON | Generates `CL-YYYY-NNNNN` reference |
| **Complainant Cases** | `GET /api/v1/public/my-complaints?page=1&page_size=20` | None (`Bearer <token>`) | Only returns cases owned by user |
| **Track Complaint** | `GET /api/v1/public/complaints/{reference}` | None (`Bearer <token>`) | Enforces owner access check |
| **Public Timeline** | `GET /api/v1/public/complaints/{case_id}/timeline` | None (`Bearer <token>`) | Only returns public actions |
| **Case Detail** | `GET /api/v1/cases/{case_id}` | None (`Bearer <token>`) | Single case details |
| **Attachment Upload** | `POST /api/v1/public/complaints/{case_id}/attachments` | `multipart/form-data` | Demo metadata file upload |

---

## 6. Security & Privacy Guarantees

1. **Authentication Protection**:
   - Access tokens are stored cautiously in `sessionStorage` (cleared upon tab close) and sent via `Authorization: Bearer <token>`.
   - Passwords and direct database credentials are never stored or exposed in the frontend.
2. **Strict Privacy Segregation**:
   - The public portal only consumes public-safe endpoints (`/api/v1/public/*`).
   - Internal officer notes, audit logs, and AI cross-bureau overlap recommendations are never queried or displayed in this application.
3. **No Direct Database Writes**:
   - The application does not include or initialize the Supabase client SDK for direct database manipulation. All writes pass through FastAPI validation.
