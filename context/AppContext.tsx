import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AppLanguage, Job } from '../types';
import { INITIAL_PROFILE, MOCK_JOBS } from '../constants';

interface AppContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dyslexicMode: boolean;
  toggleDyslexicMode: () => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  savedJobs: string[];
  toggleSaveJob: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('cv_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dyslexicMode, setDyslexicMode] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(AppLanguage.ENGLISH);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('cv_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleDyslexicMode = () => setDyslexicMode(prev => !prev);
  
  const toggleSaveJob = (id: string) => {
    setSavedJobs(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]);
  };

  return (
    <AppContext.Provider value={{ 
      profile, setProfile, 
      theme, toggleTheme, 
      dyslexicMode, toggleDyslexicMode, 
      language, setLanguage,
      savedJobs, toggleSaveJob
    }}>
      <div className={dyslexicMode ? 'dyslexic-font' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
