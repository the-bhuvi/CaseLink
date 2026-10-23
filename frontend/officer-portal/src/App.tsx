import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Cases } from "@/pages/Cases";
import { CaseDetail } from "@/pages/CaseDetail";
import { Institutions } from "@/pages/Institutions";
import { InstitutionDetail } from "@/pages/InstitutionDetail";
import { Coordination } from "@/pages/Coordination";
import { Analytics } from "@/pages/Analytics";
import { Notifications } from "@/pages/Notifications";
import { NotFound } from "@/pages/NotFound";

function Protected() { const { user, loading } = useAuth(); if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Restoring session…</div>; return user ? <AppShell /> : <Navigate to="/login" replace />; }
export default function App() { return <Routes><Route path="/login" element={<Login />} /><Route element={<Protected />}><Route element={<Outlet />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/cases" element={<Cases />} /><Route path="/cases/:caseId" element={<CaseDetail />} /><Route path="/institutions" element={<Institutions />} /><Route path="/institutions/:institutionId" element={<InstitutionDetail />} /><Route path="/coordination" element={<Coordination />} /><Route path="/analytics" element={<Analytics />} /><Route path="/notifications" element={<Notifications />} /></Route></Route><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="*" element={<NotFound />} /></Routes>; }
