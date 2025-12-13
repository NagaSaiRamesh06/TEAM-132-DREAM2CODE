import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ResumeBuilder } from './pages/ResumeBuilder';
import { ATSChecker } from './pages/ATSChecker';
import { MockInterview } from './pages/MockInterview';
import { SkillGap } from './pages/SkillGap';
import { Jobs } from './pages/Jobs';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resume" element={<ResumeBuilder />} />
            <Route path="/ats" element={<ATSChecker />} />
            <Route path="/interview" element={<MockInterview />} />
            <Route path="/skills" element={<SkillGap />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
