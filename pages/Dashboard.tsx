import React from 'react';
import { useApp } from '../context/AppContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowRight, Briefcase } from 'lucide-react';

const DashboardCard = ({ title, children, className }: any) => (
  <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">{title}</h3>
    {children}
  </div>
);

export const Dashboard: React.FC = () => {
  const { profile, savedJobs } = useApp();

  const completionScore = [
    { name: 'Completed', value: profile.skills.length > 0 ? 70 : 30 },
    { name: 'Remaining', value: profile.skills.length > 0 ? 30 : 70 },
  ];
  const COLORS = ['#0ea5e9', '#e2e8f0'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome back, {profile.name || 'Student'}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your AI career assistant is ready. Here's your progress today.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Status */}
        <DashboardCard title="Profile Strength">
          <div className="h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionScore}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {completionScore.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{completionScore[0].value}%</span>
              <span className="text-xs text-slate-500">Completed</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
             {!profile.targetRole && (
               <div className="flex items-center gap-2 text-amber-500 text-sm">
                 <AlertCircle size={16} />
                 <span>Set a target role to get matches</span>
               </div>
             )}
             {profile.skills.length === 0 && (
               <div className="flex items-center gap-2 text-amber-500 text-sm">
                 <AlertCircle size={16} />
                 <span>Add skills to your profile</span>
               </div>
             )}
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard title="Recommended Actions" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/resume" className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-indigo-500 text-white p-2 rounded-lg text-xs font-bold">Resume</span>
                <ArrowRight size={18} className="text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-indigo-200">Update Resume</h4>
              <p className="text-sm text-slate-600 dark:text-indigo-300/80">Regenerate with new keywords.</p>
            </Link>

            <Link to="/ats" className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold">ATS Score</span>
                <ArrowRight size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-emerald-200">Check Score</h4>
              <p className="text-sm text-slate-600 dark:text-emerald-300/80">Test your resume against a JD.</p>
            </Link>

            <Link to="/interview" className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-purple-500 text-white p-2 rounded-lg text-xs font-bold">Practice</span>
                <ArrowRight size={18} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-purple-200">Mock Interview</h4>
              <p className="text-sm text-slate-600 dark:text-purple-300/80">Practice verbal answers.</p>
            </Link>

             <Link to="/jobs" className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-500 text-white p-2 rounded-lg text-xs font-bold">Jobs</span>
                <ArrowRight size={18} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-blue-200">{savedJobs.length} Saved Jobs</h4>
              <p className="text-sm text-slate-600 dark:text-blue-300/80">View your applications.</p>
            </Link>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Recent Activity">
           <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                 <CheckCircle size={16} />
               </div>
               <div>
                 <p className="text-sm font-medium dark:text-slate-200">Profile Updated</p>
                 <p className="text-xs text-slate-500">2 hours ago</p>
               </div>
             </div>
             {savedJobs.length > 0 && (
                <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Briefcase size={16} />
                </div>
                <div>
                    <p className="text-sm font-medium dark:text-slate-200">Saved {savedJobs.length} Jobs</p>
                    <p className="text-xs text-slate-500">Recently</p>
                </div>
                </div>
             )}
           </div>
        </DashboardCard>
      </div>
    </div>
  );
};