import { Job } from './types';

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Frontend Engineer',
    company: 'TechFlow Solutions',
    location: 'Bangalore (Remote)',
    type: 'Full-time',
    salary: '₹8L - ₹12L',
    posted: '2 days ago',
    skillsRequired: ['React', 'TypeScript', 'Tailwind', 'Redux'],
    description: 'We are looking for a passionate Frontend Engineer to build modern web applications using React and TypeScript.'
  },
  {
    id: '2',
    title: 'Junior Data Analyst',
    company: 'DataWiz Corp',
    location: 'Mumbai',
    type: 'Hybrid',
    salary: '₹5L - ₹8L',
    posted: '1 day ago',
    skillsRequired: ['Python', 'SQL', 'Excel', 'Tableau'],
    description: 'Analyze large datasets to extract meaningful insights. Proficiency in Python and SQL is mandatory.'
  },
  {
    id: '3',
    title: 'Backend Developer',
    company: 'CloudNine Systems',
    location: 'Hyderabad',
    type: 'On-site',
    salary: '₹10L - ₹15L',
    posted: '3 days ago',
    skillsRequired: ['Node.js', 'MongoDB', 'AWS', 'Express'],
    description: 'Build scalable APIs and microservices. Experience with AWS and NoSQL databases is a plus.'
  },
  {
    id: '4',
    title: 'Product Design Intern',
    company: 'Creative Hub',
    location: 'Delhi',
    type: 'Internship',
    salary: '₹15k/month',
    posted: 'Just now',
    skillsRequired: ['Figma', 'UI/UX', 'Prototyping'],
    description: 'Assist in designing user interfaces for mobile and web apps. Must have a strong portfolio.'
  }
];

export const INITIAL_PROFILE = {
  name: '',
  email: '',
  phone: '',
  education: [],
  experience: [],
  skills: [],
  projects: [],
  targetRole: ''
};
