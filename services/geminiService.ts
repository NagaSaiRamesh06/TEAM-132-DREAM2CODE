import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, ATSAnalysis, SkillGapAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI only if key exists (handled in components via error checks)
const ai = new GoogleGenAI({ apiKey });

export const generateResumeContent = async (profile: UserProfile, language: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Create a professional, ATS-friendly resume in Markdown format for the following profile.
    Language: ${language}.
    Profile Data: ${JSON.stringify(profile)}
    
    Structure it with clear headers: # Name, ## Summary, ## Skills, ## Experience, ## Projects, ## Education.
    Use strong action verbs. Highlight achievements.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.4, // Slight creativity allowed for writing
      }
    });
    return response.text;
  } catch (error) {
    console.error("Resume Gen Error:", error);
    throw error;
  }
};

export const parseResumeProfile = async (
  resumeInput: string | { mimeType: string; data: string }
): Promise<Partial<UserProfile>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Analyze the provided resume and extract the following information into a structured JSON object:
    - Name
    - Email
    - Phone
    - Education (Array of { degree, institution, year, score })
    - Experience (Array of { role, company, duration, description })
    - Skills (Array of strings)
    - Projects (Array of { title, description, techStack })
    - Target Role (Infer this from the experience or summary if not explicit)

    Ensure the keys match the UserProfile interface exactly.
    If a field is not found, leave it as an empty string or empty array.
  `;

  let contents;
  if (typeof resumeInput === 'string') {
    contents = { parts: [{ text: prompt }, { text: `Resume Text: ${resumeInput}` }] };
  } else {
    contents = {
      parts: [
        { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } },
        { text: prompt }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0, // Deterministic parsing
        responseMimeType: "application/json",
        responseSchema: {
             type: Type.OBJECT,
             properties: {
                 name: { type: Type.STRING },
                 email: { type: Type.STRING },
                 phone: { type: Type.STRING },
                 targetRole: { type: Type.STRING },
                 skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                 education: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             degree: { type: Type.STRING },
                             institution: { type: Type.STRING },
                             year: { type: Type.STRING },
                             score: { type: Type.STRING }
                         }
                     }
                 },
                 experience: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             role: { type: Type.STRING },
                             company: { type: Type.STRING },
                             duration: { type: Type.STRING },
                             description: { type: Type.STRING }
                         }
                     }
                 },
                 projects: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             title: { type: Type.STRING },
                             description: { type: Type.STRING },
                             techStack: { type: Type.STRING }
                         }
                     }
                 }
             }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Parse Profile Error:", error);
    throw error;
  }
};

export const analyzeATS = async (
  resumeInput: string | { mimeType: string; data: string }, 
  jobDescription: string
): Promise<ATSAnalysis> => {
  const model = "gemini-2.5-flash";
  
  const systemPrompt = `
    Act as an algorithmic ATS (Applicant Tracking System) scanner.
    Compare the Resume provided (in the preceding attachment or text) against the Job Description below.
    
    SCORING RUBRIC (Strictly follow this to ensure consistency):
    1. Keyword Matching (40%): Extract key technical skills/nouns from JD and check for presence in Resume.
    2. Experience Relevance (30%): Match job titles, seniority, and industry experience.
    3. Formatting & Structure (15%): Check for clear sections, standard headers, and readability.
    4. Education & Soft Skills (15%): Check for required degrees and soft skills.

    Be objective. If the input is the same, the score MUST be the same.
    
    Job Description: ${jobDescription.substring(0, 3000)}
    
    Return a JSON object strictly following this schema.
  `;

  let contents;
  
  if (typeof resumeInput === 'string') {
    // Text input
    contents = {
      parts: [
        { text: systemPrompt },
        { text: `Resume Content: ${resumeInput.substring(0, 5000)}` }
      ]
    };
  } else {
    // File input (Multimodal)
    // Sending image/pdf data first often helps the model contextually
    contents = {
      parts: [
        { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } },
        { text: systemPrompt }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contents,
      config: {
        temperature: 0, // CRITICAL: Deterministic output to prevent score fluctuation
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Match score from 0 to 100" },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING, description: "Brief overall feedback" }
          },
          required: ["score", "missingKeywords", "formattingIssues", "contentSuggestions", "summary"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    // Ensure all fields exist to prevent UI crashes
    return {
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        formattingIssues: Array.isArray(parsed.formattingIssues) ? parsed.formattingIssues : [],
        contentSuggestions: Array.isArray(parsed.contentSuggestions) ? parsed.contentSuggestions : [],
        summary: parsed.summary || "Could not analyze the resume content. Please try converting to text."
    };
  } catch (error) {
    console.error("ATS Error:", error);
    return { 
        score: 0, 
        missingKeywords: [], 
        formattingIssues: [], 
        contentSuggestions: ["System Error: Could not process file."], 
        summary: "Analysis failed. Please ensure the resume is a readable PDF or Text file." 
    };
  }
};

export const analyzeSkillGap = async (currentSkills: string[], targetRole: string): Promise<SkillGapAnalysis> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Analyze the skill gap for a user wanting to be a "${targetRole}".
    Current Skills: ${currentSkills.join(", ")}.
    
    Identify missing critical skills, assign a match score, and create a 4-week learning path.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0, // Deterministic analysis
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                matchScore: { type: Type.NUMBER },
                missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                strongSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                learningPath: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            week: { type: Type.NUMBER },
                            topic: { type: Type.STRING },
                            resources: { type: Type.ARRAY, items: { type: Type.STRING } },
                            actionItem: { type: Type.STRING }
                        }
                    }
                }
            }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Skill Gap Error:", error);
    throw error;
  }
};

export const getInterviewChat = (history: { role: string; text: string }[], role: string) => {
    // Returns the chat object to manage stream or messages
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        config: {
            systemInstruction: `You are a professional Interviewer conducting an interview for the role of ${role}. 
            Ask one relevant question at a time. 
            Evaluate the user's previous answer briefly before moving to the next question.
            Keep the tone professional but encouraging. 
            If the user asks for feedback, give it.`
        }
    });
    return chat;
}