import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Briefcase, FileText, UserCheck, MessageSquare, 
  TrendingUp, Settings, Menu, X, Moon, Sun, Type 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const SidebarItem = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, dyslexicMode, toggleDyslexicMode } = useApp();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', icon: TrendingUp, label: 'Dashboard' },
    { to: '/resume', icon: FileText, label: 'Resume Builder' },
    { to: '/ats', icon: UserCheck, label: 'ATS Checker' },
    { to: '/interview', icon: MessageSquare, label: 'Mock Interview' },
    { to: '/skills', icon: Settings, label: 'Skill Gap' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Briefcase className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">CareerVibe</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              active={location.pathname === item.to}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button 
            onClick={toggleDyslexicMode}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              dyslexicMode ? 'text-brand-600 bg-brand-50 dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Type size={18} />
            <span>Dyslexia Font</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 justify-between shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500">
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-900 dark:text-white">Career Vibe AI</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};
