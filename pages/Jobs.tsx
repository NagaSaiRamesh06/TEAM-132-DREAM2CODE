import React, { useState } from 'react';
import { MOCK_JOBS } from '../constants';
import { useApp } from '../context/AppContext';
import { Briefcase, MapPin, Clock, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export const Jobs: React.FC = () => {
  const { savedJobs, toggleSaveJob, profile } = useApp();
  const [filter, setFilter] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

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

  const handleApply = (link?: string) => {
      if (link) {
          window.open(link, '_blank', 'noopener,noreferrer');
      } else {
          alert("Application link not available for this mock job.");
      }
  };

  const toggleDetails = (id: string) => {
      setExpandedJobId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
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
            <div key={job.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border transition-all duration-200 relative group ${expandedJobId === job.id ? 'border-brand-200 dark:border-brand-900 shadow-md ring-1 ring-brand-100 dark:ring-brand-900/50' : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleSaveJob(job.id); }}
                    className="absolute top-6 right-6 text-slate-400 hover:text-brand-500 transition-colors z-10"
                    title={savedJobs.includes(job.id) ? "Unsave Job" : "Save Job"}
                >
                    {savedJobs.includes(job.id) ? <BookmarkCheck className="text-brand-500" size={24} fill="currentColor"/> : <Bookmark size={24} />}
                </button>

                <div className="flex justify-between items-start mb-4 pr-10 cursor-pointer" onClick={() => toggleDetails(job.id)}>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{job.title}</h3>
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

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 cursor-pointer" onClick={() => toggleDetails(job.id)}>
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

                {/* Expanded Description Section */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedJobId === job.id ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Job Description</h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                            {job.description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button 
                        onClick={() => toggleDetails(job.id)}
                        className="text-brand-600 font-medium hover:underline text-sm flex items-center gap-1"
                    >
                        {expandedJobId === job.id ? (
                            <>Hide Details <ChevronUp size={16} /></>
                        ) : (
                            <>View Details <ChevronDown size={16} /></>
                        )}
                    </button>
                    <button 
                        onClick={() => handleApply(job.applyLink)}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        Apply Now <ExternalLink size={14} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};