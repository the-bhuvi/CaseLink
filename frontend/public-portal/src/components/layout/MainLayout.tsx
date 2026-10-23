import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ServiceBanner } from '@/components/feedback/ServiceBanner';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-civic-off-white text-navy-900">
      <ServiceBanner />
      <Header />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
