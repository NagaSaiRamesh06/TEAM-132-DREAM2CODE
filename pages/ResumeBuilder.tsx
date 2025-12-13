import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { generateResumeContent, parseResumeProfile } from '../services/geminiService';
import { Download, Loader2, Sparkles, Plus, Trash2, FileText, Printer, FileDown, Upload, X, File as FileIcon } from 'lucide-react';

export const ResumeBuilder: React.FC = () => {
  const { profile, setProfile, language } = useApp();
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'reference' | 'basic' | 'education' | 'experience' | 'projects' | 'preview'>('reference');
  
  // Import / Reference State
  const [importMode, setImportMode] = useState<'text' | 'file'>('text');
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const content = await generateResumeContent(profile, language);
      setGeneratedResume(content || '');
      setActiveTab('preview');
    } catch (err) {
      alert("Failed to generate resume. Please check API Key.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleImport = async () => {
      if (importMode === 'text' && !importText) return;
      if (importMode === 'file' && !importFile) return;

      setImportLoading(true);
      try {
          let input: string | { mimeType: string; data: string };
          
          if (importMode === 'file' && importFile) {
               if (importFile.type === 'application/pdf') {
                   const base64 = await fileToBase64(importFile);
                   input = { mimeType: 'application/pdf', data: base64 };
               } else if (importFile.type === 'text/plain') {
                   input = await fileToText(importFile);
               } else {
                   alert("Unsupported file type. Use PDF or TXT.");
                   setImportLoading(false);
                   return;
               }
          } else {
              input = importText;
          }

          const extractedData = await parseResumeProfile(input);
          
          setProfile(prev => ({
              ...prev,
              ...extractedData,
              education: extractedData.education || [],
              experience: extractedData.experience || [],
              skills: extractedData.skills || [],
              projects: extractedData.projects || []
          }));

          alert("Profile auto-filled successfully! Please review the details in other tabs.");
          setActiveTab('basic');

      } catch (e) {
          console.error(e);
          alert("Failed to parse resume.");
      } finally {
          setImportLoading(false);
      }
  };

  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '', score: '' }]
    }));
  };

  const addExperience = () => {
    setProfile(prev => ({
        ...prev,
        experience: [...prev.experience, { role: '', company: '', duration: '', description: '' }]
    }));
  };
  
  const addProject = () => {
    setProfile(prev => ({
        ...prev,
        projects: [...prev.projects, { title: '', description: '', techStack: '' }]
    }));
  };

  const printResume = () => {
    window.print();
  };

  // Improved Download Function for Word compatibility with Compact Styling
  const downloadAsWord = () => {
    if (!resumeRef.current) return;
    
    // Minimal HTML wrapper with strict compact CSS for Word
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${profile.name || 'Resume'}</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 10.5pt; line-height: 1.2; color: #000; }
          h1 { font-size: 20pt; font-weight: bold; text-transform: uppercase; text-align: center; margin-bottom: 4px; padding-bottom: 6px; border-bottom: 2px solid #000; }
          h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #666; padding-bottom: 2px; margin-top: 10px; margin-bottom: 6px; }
          h3 { font-size: 11pt; font-weight: bold; margin-bottom: 2px; margin-top: 2px; }
          p { margin-bottom: 2px; margin-top: 0; text-align: justify; }
          ul { margin-top: 2px; margin-bottom: 6px; padding-left: 18px; }
          li { margin-bottom: 1px; }
        </style>
      </head><body>
    `;
    const postHtml = "</body></html>";
    
    const htmlContent = resumeRef.current.innerHTML;
    const completeHtml = preHtml + htmlContent + postHtml;
    
    const blob = new Blob(['\ufeff', completeHtml], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name ? profile.name.replace(/\s+/g, '_') : 'Resume'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ultra-Compact Custom Markdown Components for Professional Single-Page Look
  const ResumeComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-center uppercase mb-1 text-slate-900 border-b-2 border-slate-900 pb-2 tracking-wide" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-lg font-bold uppercase border-b border-slate-400 mt-3 mb-2 pb-0.5 text-slate-800 tracking-wider" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-base font-bold text-slate-800 mt-1.5 mb-0.5" {...props} />,
    p: ({node, ...props}: any) => <p className="text-sm leading-snug mb-1 text-slate-700 text-justify" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc ml-4 text-sm space-y-0.5 mb-2 text-slate-700" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1 leading-snug" {...props} />,
    strong: ({node, ...props}: any) => <span className="font-bold text-slate-900" {...props} />,
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      
      {/* Left: Editor */}
      <div className="w-full md:w-5/12 flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-2 overflow-x-auto no-scrollbar">
            {['reference', 'basic', 'education', 'experience', 'projects', 'preview'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap flex-shrink-0 transition-colors ${
                        activeTab === tab 
                        ? 'bg-brand-500 text-white shadow-md' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    {tab === 'reference' ? 'Import' : tab}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === 'reference' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-900/30">
                        <h3 className="font-semibold text-brand-800 dark:text-brand-200 flex items-center gap-2">
                            <Sparkles size={18} /> Smart Import
                        </h3>
                        <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
                            Upload your old resume or paste text to auto-fill your profile details using AI.
                        </p>
                    </div>

                    <div className="flex gap-2 mb-4">
                         <button 
                            onClick={() => setImportMode('text')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg border ${importMode === 'text' ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                         >
                            Paste Text
                         </button>
                         <button 
                            onClick={() => setImportMode('file')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg border ${importMode === 'file' ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                         >
                            Upload File
                         </button>
                    </div>

                    {importMode === 'text' ? (
                        <textarea 
                            className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
                            placeholder="Paste your existing resume content here..."
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                        />
                    ) : (
                        <div className="h-64 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            {!importFile ? (
                                <>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={(e) => e.target.files && setImportFile(e.target.files[0])}
                                        accept=".pdf,.txt,application/pdf,text/plain"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="bg-brand-100 dark:bg-brand-900/30 p-4 rounded-full mb-3 text-brand-600">
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm font-medium dark:text-white">Click to upload PDF or TXT</p>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <FileIcon size={48} className="text-brand-500 mb-2" />
                                        <button 
                                            onClick={() => { setImportFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <p className="font-medium dark:text-white truncate max-w-full px-4">{importFile.name}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={handleImport}
                        disabled={importLoading || (importMode === 'text' ? !importText : !importFile)}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                        {importLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        Auto-Fill Profile
                    </button>
                </div>
            )}

            {activeTab === 'basic' && (
                <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg font-semibold dark:text-white">Basic Info</h3>
                    <input 
                        type="text" placeholder="Full Name" className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                    />
                    <input 
                        type="email" placeholder="Email" className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
                    />
                     <input 
                        type="tel" placeholder="Phone" className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Target Role (e.g., Software Engineer)" className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={profile.targetRole} onChange={e => setProfile({...profile, targetRole: e.target.value})}
                    />
                    <textarea 
                        placeholder="Skills (comma separated)" className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white h-32"
                        value={profile.skills.join(', ')} onChange={e => setProfile({...profile, skills: e.target.value.split(',').map(s => s.trim())})}
                    />
                </div>
            )}

            {activeTab === 'education' && (
                <div className="space-y-4 animate-fade-in">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold dark:text-white">Education</h3>
                        <button onClick={addEducation} className="text-brand-500 hover:text-brand-600"><Plus size={20}/></button>
                    </div>
                    {profile.education.map((edu, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 space-y-2 relative">
                             <button onClick={() => {
                                 const newEdu = [...profile.education];
                                 newEdu.splice(idx, 1);
                                 setProfile({...profile, education: newEdu});
                             }} className="absolute top-2 right-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"><Trash2 size={16}/></button>
                            <input 
                                placeholder="Degree" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={edu.degree} onChange={e => {
                                    const newEdu = [...profile.education];
                                    newEdu[idx].degree = e.target.value;
                                    setProfile({...profile, education: newEdu});
                                }}
                            />
                             <input 
                                placeholder="Institution" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={edu.institution} onChange={e => {
                                    const newEdu = [...profile.education];
                                    newEdu[idx].institution = e.target.value;
                                    setProfile({...profile, education: newEdu});
                                }}
                            />
                             <div className="flex gap-2">
                                <input 
                                    placeholder="Year" className="w-1/2 p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                    value={edu.year} onChange={e => {
                                        const newEdu = [...profile.education];
                                        newEdu[idx].year = e.target.value;
                                        setProfile({...profile, education: newEdu});
                                    }}
                                />
                                <input 
                                    placeholder="Score/CGPA" className="w-1/2 p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                    value={edu.score} onChange={e => {
                                        const newEdu = [...profile.education];
                                        newEdu[idx].score = e.target.value;
                                        setProfile({...profile, education: newEdu});
                                    }}
                                />
                             </div>
                        </div>
                    ))}
                </div>
            )}
             {activeTab === 'experience' && (
                <div className="space-y-4 animate-fade-in">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold dark:text-white">Experience</h3>
                        <button onClick={addExperience} className="text-brand-500 hover:text-brand-600"><Plus size={20}/></button>
                    </div>
                    {profile.experience.map((exp, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 space-y-2 relative">
                             <button onClick={() => {
                                 const newExp = [...profile.experience];
                                 newExp.splice(idx, 1);
                                 setProfile({...profile, experience: newExp});
                             }} className="absolute top-2 right-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"><Trash2 size={16}/></button>
                            <input 
                                placeholder="Role" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={exp.role} onChange={e => {
                                    const newExp = [...profile.experience];
                                    newExp[idx].role = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }}
                            />
                             <input 
                                placeholder="Company" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={exp.company} onChange={e => {
                                    const newExp = [...profile.experience];
                                    newExp[idx].company = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }}
                            />
                             <input 
                                placeholder="Duration" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={exp.duration} onChange={e => {
                                    const newExp = [...profile.experience];
                                    newExp[idx].duration = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }}
                            />
                             <textarea 
                                placeholder="Description" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white h-24"
                                value={exp.description} onChange={e => {
                                    const newExp = [...profile.experience];
                                    newExp[idx].description = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="space-y-4 animate-fade-in">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold dark:text-white">Projects</h3>
                        <button onClick={addProject} className="text-brand-500 hover:text-brand-600"><Plus size={20}/></button>
                    </div>
                    {profile.projects.map((proj, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 space-y-2 relative">
                             <button onClick={() => {
                                 const newProjs = [...profile.projects];
                                 newProjs.splice(idx, 1);
                                 setProfile({...profile, projects: newProjs});
                             }} className="absolute top-2 right-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"><Trash2 size={16}/></button>
                            <input 
                                placeholder="Project Title" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={proj.title} onChange={e => {
                                    const newProjs = [...profile.projects];
                                    newProjs[idx].title = e.target.value;
                                    setProfile({...profile, projects: newProjs});
                                }}
                            />
                             <input 
                                placeholder="Tech Stack (e.g. React, Node.js)" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white"
                                value={proj.techStack} onChange={e => {
                                    const newProjs = [...profile.projects];
                                    newProjs[idx].techStack = e.target.value;
                                    setProfile({...profile, projects: newProjs});
                                }}
                            />
                             <textarea 
                                placeholder="Description" className="w-full p-2 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 dark:text-white h-24"
                                value={proj.description} onChange={e => {
                                    const newProjs = [...profile.projects];
                                    newProjs[idx].description = e.target.value;
                                    setProfile({...profile, projects: newProjs});
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'preview' && (
                 <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                    {!generatedResume ? (
                        <div className="text-slate-500">
                            <p className="mb-4">Fill in your details in the tabs above.</p>
                            <button 
                                onClick={() => setActiveTab('reference')}
                                className="text-brand-600 underline"
                            >
                                Or import from an existing resume
                            </button>
                        </div>
                    ) : (
                        <div className="text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                            Resume ready! See preview on the right.
                        </div>
                    )}
                 </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                Generate Professional Resume
            </button>
        </div>
      </div>

      {/* Right: WYSIWYG Preview */}
      <div className={`w-full md:w-7/12 flex flex-col bg-slate-200 dark:bg-slate-900 overflow-hidden relative print-container`}>
         
         <div className="bg-white dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 flex justify-end gap-2 no-print shadow-sm z-10">
             <button 
                onClick={downloadAsWord} 
                disabled={!generatedResume} 
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                title="Download as Word Document"
            >
                <FileDown size={18} /> Word / Docs
            </button>
            <button 
                onClick={printResume} 
                disabled={!generatedResume} 
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                title="Save as PDF / Print"
            >
                <Printer size={18} /> PDF / Print
            </button>
         </div>
         
         {/* A4 Paper Container - Compact Mode */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-100 dark:bg-slate-900/50">
            <div 
                className="bg-white shadow-xl text-slate-900 print:shadow-none print:w-full print:m-0"
                style={{ 
                    width: '210mm', 
                    minHeight: '297mm', 
                    padding: '15mm', // Reduced padding for single-page fit
                    boxSizing: 'border-box'
                }}
            >
                {generatedResume ? (
                    <div ref={resumeRef} className="resume-content">
                        <ReactMarkdown components={ResumeComponents}>
                            {generatedResume}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-10">
                        <FileText size={48} className="mb-4 opacity-30"/>
                        <p>Your resume preview will appear here.</p>
                        <p className="text-sm mt-2">Click "Generate Professional Resume" to start.</p>
                    </div>
                )}
            </div>
         </div>
      </div>

    </div>
  );
};