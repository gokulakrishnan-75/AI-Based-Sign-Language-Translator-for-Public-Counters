import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HackathonDemoModal from './components/HackathonDemoModal';

// Pages
import LandingPage from './pages/LandingPage';
import LiveTranslatorPage from './pages/LiveTranslatorPage';
import SignLibraryPage from './pages/SignLibraryPage';
import PublicCounterPage from './pages/PublicCounterPage';
import DatasetStudioPage from './pages/DatasetStudioPage';
import DashboardPage from './pages/DashboardPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import HowItWorksPage from './pages/HowItWorksPage';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [practiceSign, setPracticeSign] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const handleSelectSignForPractice = (sign) => {
    setPracticeSign(sign);
    setActivePage('translator');
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenDemo={() => setDemoModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {activePage === 'home' && (
          <LandingPage
            setActivePage={setActivePage}
            onOpenDemo={() => setDemoModalOpen(true)}
          />
        )}

        {activePage === 'translator' && (
          <LiveTranslatorPage
            setActivePage={setActivePage}
            initialSelectedSign={practiceSign}
          />
        )}

        {activePage === 'library' && (
          <SignLibraryPage
            setActivePage={setActivePage}
            onSelectSignForPractice={handleSelectSignForPractice}
          />
        )}

        {activePage === 'counter' && (
          <PublicCounterPage
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'studio' && (
          <DatasetStudioPage />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage />
        )}

        {activePage === 'performance' && (
          <ModelPerformancePage />
        )}

        {activePage === 'how-it-works' && (
          <HowItWorksPage
            setActivePage={setActivePage}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setActivePage={setActivePage} />

      {/* 7-Step Hackathon Judge Guided Demo Modal */}
      <HackathonDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onLaunchLive={() => {
          setDemoModalOpen(false);
          setActivePage('translator');
        }}
      />

    </div>
  );
}
