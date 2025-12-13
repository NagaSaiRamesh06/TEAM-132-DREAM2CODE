import React, { useState, useRef } from 'react';
import { analyzeATS } from '../services/geminiService';
import { ATSAnalysis } from '../types';
import { Loader2, CheckCircle, AlertTriangle, FileText, Upload, X, File as FileIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const ATSChecker: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSAnalysis | null>(null);
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Reset result when new file is chosen
      setResult(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setResult(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
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

  const handleAnalyze = async () => {
    // Explicit Validation with Alerts
    if (!jobDesc.trim()) {
      alert("⚠️ Job Description is missing.\n\nPlease paste the job description you are applying for. The AI needs this to calculate your score.");
      return;
    }

    if (mode === 'text' && !resumeText.trim()) {
      alert("⚠️ Resume content is missing.\n\nPlease paste your resume text.");
      return;
    }

    if (mode === 'file' && !selectedFile) {
      alert("⚠️ No file selected.\n\nPlease upload your resume (PDF or TXT).");
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      let resumeInput: string | { mimeType: string; data: string };

      if (mode === 'file' && selectedFile) {
        // Robust file type checking
        const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
        const isTxt = selectedFile.type === 'text/plain' || selectedFile.name.toLowerCase().endsWith('.txt');

        if (isPdf) {
             const base64Data = await fileToBase64(selectedFile);
             resumeInput = { mimeType: 'application/pdf', data: base64Data };
        } else if (isTxt) {
             const textContent = await fileToText(selectedFile);
             resumeInput = textContent;
        } else {
            alert("❌ Unsupported file format.\n\nPlease upload a PDF or Text (.txt) file.");
            setLoading(false);
            return;
        }
      } else {
        resumeInput = resumeText;
      }

      const data = await analyzeATS(resumeInput, jobDesc);
      
      if (data.score === 0 && data.summary.toLowerCase().includes("error")) {
          alert("⚠️ We couldn't analyze this file.\n\nPlease ensure it is a valid PDF containing selectable text (not scanned images), or try pasting the text content directly.");
      }
      
      setResult(data);
    } catch (e) {
      alert("❌ Analysis failed.\n\nPlease check your internet connection or try pasting the resume text instead of uploading.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
        <FileText className="text-brand-500"/> ATS Resume Checker
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Resume Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium dark:text-slate-300">Resume Input</label>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button 
                onClick={() => setMode('text')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  mode === 'text' 
                    ? 'bg-white dark:bg-slate-600 text-brand-600 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Paste Text
              </button>
              <button 
                onClick={() => setMode('file')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  mode === 'file' 
                    ? 'bg-white dark:bg-slate-600 text-brand-600 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {mode === 'text' ? (
            <textarea 
              className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Paste your resume content here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
          ) : (
            <div className="h-64 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-6 text-center relative hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
              {!selectedFile ? (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.txt,application/pdf,text/plain"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-brand-100 dark:bg-brand-900/30 p-4 rounded-full mb-3 text-brand-600">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-medium dark:text-white">Click or drop file to upload</p>
                  <p className="text-xs text-slate-500 mt-1">PDF or Text files supported</p>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="relative">
                    <FileIcon size={48} className="text-brand-500 mb-2" />
                    <button 
                      onClick={clearFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="font-medium dark:text-white truncate max-w-full px-4">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="mt-4 text-xs text-brand-600 hover:underline"
                  >
                    Change File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.txt,application/pdf,text/plain"
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Job Description */}
        <div className="space-y-4">
          <label className="block text-sm font-medium dark:text-slate-300 h-8 flex items-center justify-between">
            <span>Job Description <span className="text-red-500">*</span></span>
            {jobDesc.length === 0 && (
                <span className="text-xs text-amber-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> Required for scoring
                </span>
            )}
          </label>
          <textarea 
            className={`w-full h-64 p-4 rounded-xl border dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none transition-colors ${
                !jobDesc && !loading ? 'border-amber-300 dark:border-amber-700/50' : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder="Paste the Job Description here... (Required)"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
          />
        </div>
      </div>

      <button 
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
            <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Scanning Resume...
            </span>
        ) : "Scan Score"}
      </button>

      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 animate-fade-in scroll-mt-20" id="results-section">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="w-48 h-48 relative flex-shrink-0">
               <ResponsiveContainer>
                 <PieChart>
                    <Pie
                        data={[{ value: result.score }, { value: 100 - result.score }]}
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={180}
                        endAngle={0}
                        dataKey="value"
                    >
                        <Cell fill={result.score > 70 ? '#10b981' : result.score > 40 ? '#f59e0b' : '#ef4444'} />
                        <Cell fill="#e2e8f0" />
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                   <span className="text-4xl font-bold dark:text-white">{result.score}/100</span>
                   <span className="text-sm text-slate-500">ATS Score</span>
               </div>
            </div>
            
            <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold dark:text-white">Analysis Summary</h3>
                <p className="text-slate-600 dark:text-slate-300">{result.summary}</p>
                
                <div className="flex flex-wrap gap-2">
                    {result.score > 70 ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Good Match</span>
                    ) : result.score > 40 ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">Needs Improvement</span>
                    ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Low Match</span>
                    )}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} /> Missing Keywords
                </h4>
                <ul className="space-y-2">
                    {result.missingKeywords.map((kw, i) => (
                        <li key={i} className="text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {kw}
                        </li>
                    ))}
                    {result.missingKeywords.length === 0 && <li className="text-sm text-slate-500">No major keywords missing.</li>}
                </ul>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                     <FileText size={18} /> Formatting Issues
                </h4>
                <ul className="space-y-2">
                    {result.formattingIssues.map((issue, i) => (
                        <li key={i} className="text-sm text-orange-600 dark:text-orange-300 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            {issue}
                        </li>
                    ))}
                    {result.formattingIssues.length === 0 && <li className="text-sm text-slate-500">Formatting looks good.</li>}
                </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} /> Suggestions
                </h4>
                <ul className="space-y-2">
                    {result.contentSuggestions.map((sug, i) => (
                        <li key={i} className="text-sm text-blue-600 dark:text-blue-300 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {sug}
                        </li>
                    ))}
                    {result.contentSuggestions.length === 0 && <li className="text-sm text-slate-500">No specific suggestions.</li>}
                </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};