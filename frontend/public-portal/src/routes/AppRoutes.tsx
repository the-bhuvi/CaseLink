import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LandingPage } from '@/pages/landing/LandingPage';
import { SubmitPage } from '@/pages/submit/SubmitPage';
import { ConfirmationPage } from '@/pages/confirmation/ConfirmationPage';
import { TrackPage } from '@/pages/track/TrackPage';
import { MyComplaintsPage } from '@/pages/my-complaints/MyComplaintsPage';
import { ComplaintDetailPage } from '@/pages/complaint-detail/ComplaintDetailPage';
import { HelpPage } from '@/pages/help/HelpPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="submit" element={<SubmitPage />} />
        <Route path="confirmation/:reference" element={<ConfirmationPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="my-complaints" element={<MyComplaintsPage />} />
        <Route path="my-complaints/:id" element={<ComplaintDetailPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
