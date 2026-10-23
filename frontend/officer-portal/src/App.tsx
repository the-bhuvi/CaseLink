import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { Cases } from "@/pages/Cases";
import { CaseDetail } from "@/pages/CaseDetail";
import { Institutions } from "@/pages/Institutions";
import { InstitutionDetail } from "@/pages/InstitutionDetail";
import { Coordination } from "@/pages/Coordination";
import { Analytics } from "@/pages/Analytics";
import { Notifications } from "@/pages/Notifications";
import { NotFound } from "@/pages/NotFound";

export default function App() { return <Routes><Route element={<AppShell />}><Route element={<Outlet />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/cases" element={<Cases />} /><Route path="/cases/:caseId" element={<CaseDetail />} /><Route path="/institutions" element={<Institutions />} /><Route path="/institutions/:institutionId" element={<InstitutionDetail />} /><Route path="/coordination" element={<Coordination />} /><Route path="/analytics" element={<Analytics />} /><Route path="/notifications" element={<Notifications />} /></Route></Route><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="*" element={<NotFound />} /></Routes>; }
