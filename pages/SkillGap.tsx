import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeSkillGap, parseResumeProfile } from '../services/geminiService';
import { SkillGapAnalysis } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Loader2, Target, BookOpen, Upload, FileText } from 'lucide-react';

export const SkillGap: React.FC = () => {
  const { profile, setProfile } = useApp();
  const [targetRole, setTargetRole] = useState(profile.targetRole || '');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
  };

  const fileToText = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsText(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setParsing(true);
          try {
               let input: string | { mimeType: string; data: string };
               
               if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                   const base64 = await fileToBase64(file);
                   input = { mimeType: 'application/pdf', data: base64 };
               } else {
                   input = await fileToText(file);
               }
               
               const data = await parseResumeProfile(input);
               
               if (data.skills && Array.isArray(data.skills)) {
                   setProfile(prev => ({
                       ...prev,
                       skills: data.skills || prev.skills,
                       // Also update target role if available and not manually set
                       targetRole: (!targetRole && data.targetRole) ? (data.targetRole as string) : prev.targetRole
                   }));
                   
                   if (!targetRole && data.targetRole) {
                       setTargetRole(data.targetRole);
                   }
               } else {
                   alert("No skills found in the resume.");
               }
          } catch (error) {
              console.error(error);
              alert("Failed to extract skills from resume.");
          } finally {
              setParsing(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const handleAnalyze = async () => {
    if (!targetRole) return;
    setLoading(true);
    try {
      const result = await analyzeSkillGap(profile.skills, targetRole);
      setAnalysis(result);
    } catch (e) {
      alert("Failed to analyze skills.");
    } finally {
      setLoading(false);
    }
  };

  // Mock data for Radar Chart if analysis exists
  const chartData = analysis ? [
    { subject: 'Match Score', A: analysis.matchScore, fullMark: 100 },
    { subject: 'Skills Count', A: profile.skills.length * 10, fullMark: 100 },
    { subject: 'Missing', A: analysis.missingSkills.length * 10, fullMark: 100 },
    { subject: 'Strong', A: analysis.strongSkills.length * 10, fullMark: 100 },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header>
         <h1 className="text-2xl font-bold dark:text-white mb-2">Skill Gap Analyzer</h1>
         <p className="text-slate-600 dark:text-slate-400">See how you stack up against your target role.</p>
      </header>

      {/* Skills Section with Upload */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                  <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                     <FileText className="text-brand-500" size={20}/> Your Skills
                  </h2>
                  <p className="text-sm text-slate-500">
                    {profile.skills.length} skills loaded from profile.
                  </p>
              </div>
              <div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt"
                    className="hidden"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors font-medium text-sm"
                >
                    {parsing ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>}
                    {profile.skills.length > 0 ? "Update from Resume" : "Upload Resume"}
                </button>
              </div>
          </div>
          
          {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                          {skill}
                      </span>
                  ))}
              </div>
          ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-slate-500 mb-2">No skills found to analyze.</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="text-brand-600 hover:underline text-sm"
                  >
                      Upload your resume to extract skills automatically
                  </button>
              </div>
          )}
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Target Role</label>
            <input 
                type="text" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
        </div>
        <button 
            onClick={handleAnalyze}
            disabled={loading || !targetRole}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Target size={20} />}
            Analyze
        </button>
      </div>

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Col: Stats & Missing */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Fit Analysis</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar name="You" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                            <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-3xl font-bold text-brand-600">{analysis.matchScore}%</span>
                        <p className="text-sm text-slate-500">Role Match Score</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-red-500">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {analysis.missingSkills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm border border-red-100">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Col: Learning Path */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white">
                    <BookOpen className="text-brand-500" />
                    Recommended Learning Path
                </h3>
                
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {analysis.learningPath.map((item, idx) => (
                        <div key={idx} className="relative pl-10">
                            <div className="absolute left-1.5 top-1.5 w-5 h-5 rounded-full bg-brand-500 border-4 border-white dark:border-slate-800"></div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-500">Week {item.week}</span>
                                    <span className="px-2 py-0.5 rounded text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Target</span>
                                </div>
                                <h4 className="font-bold text-lg dark:text-white mb-2">{item.topic}</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{item.actionItem}</p>
                                
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Resources</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.resources.map((res, rIdx) => (
                                            <a href={`https://www.google.com/search?q=${res}`} target="_blank" rel="noreferrer" key={rIdx} className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                {res}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};