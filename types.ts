export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  education: {
    degree: string;
    institution: string;
    year: string;
    score: string;
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  skills: string[];
  projects: {
    title: string;
    description: string;
    techStack: string;
  }[];
  targetRole: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  matchScore?: number;
  skillsRequired: string[];
  applyLink?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SkillGapAnalysis {
  matchScore: number;
  missingSkills: string[];
  strongSkills: string[];
  learningPath: {
    week: number;
    topic: string;
    resources: string[];
    actionItem: string;
  }[];
}

export interface ATSAnalysis {
  score: number;
  missingKeywords: string[];
  formattingIssues: string[];
  contentSuggestions: string[];
  summary: string;
}

export enum AppLanguage {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  TELUGU = 'Telugu',
  TAMIL = 'Tamil',
}