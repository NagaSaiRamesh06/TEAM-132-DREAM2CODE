import React, { useState } from 'react';
import { MOCK_JOBS } from '../constants';
import { useApp } from '../context/AppContext';
import { Briefcase, MapPin, Clock, Bookmark, BookmarkCheck } from 'lucide-react';

export const Jobs: React.FC = () => {
  const { savedJobs, toggleSaveJob, profile } = useApp();
  const [filter, setFilter] = useState('');

  // Simple client-side matching simulation (in a real app, this would be an AI embedding match)
  const getMatchScore = (jobSkills: string[]) => {
    if (!profile.skills.length) return 0;
    const userSkillsLower = profile.skills.map(s => s.toLowerCase());
    const matches = jobSkills.filter(s => userSkillsLower.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)));
    return Math.round((matches.length / jobSkills.length) * 100);
  };

  const filteredJobs = MOCK_JOBS.map(job => ({
    ...job,
    matchScore: getMatchScore(job.skillsRequired)
  })).filter(job => 
    job.title.toLowerCase().includes(filter.toLowerCase()) || 
    job.company.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold dark:text-white">Job Recommendations</h1>
            <p className="text-slate-600 dark:text-slate-400">AI-matched jobs based on your skill profile.</p>
        </div>
        <input 
            type="text"
            placeholder="Search jobs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white w-full md:w-64"
        />
      </header>

      <div className="grid gap-4">
        {filteredJobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative group">
                <button 
                    onClick={() => toggleSaveJob(job.id)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-brand-500 transition-colors"
                >
                    {savedJobs.includes(job.id) ? <BookmarkCheck className="text-brand-500" size={24} fill="currentColor"/> : <Bookmark size={24} />}
                </button>

                <div className="flex justify-between items-start mb-4 pr-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{job.title}</h3>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">{job.company}</p>
                    </div>
                    {job.matchScore > 0 && (
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            job.matchScore > 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {job.matchScore}% Match
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><MapPin size={16}/> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock size={16}/> {job.posted}</span>
                    <span className="flex items-center gap-1"><Briefcase size={16}/> {job.salary}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {job.skillsRequired.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs dark:text-slate-200">
                            {skill}
                        </span>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button className="text-brand-600 font-medium hover:underline text-sm">View Details</button>
                    <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                        Apply Now
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
