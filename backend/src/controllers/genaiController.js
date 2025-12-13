// New controller: server-side wrappers for Google GenAI SDK.
// NOTE: ensure you run `npm install @google/genai` in backend and provide GEMINI_API_KEY in .env

const { GoogleGenAI, Type } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not set; GenAI endpoints will fail until it is configured.');
}
const ai = new GoogleGenAI({ apiKey });

// helper: safe send
const safeSend = (res, status, payload) => res.status(status).json(payload);

exports.generateResume = async (req, res) => {
  const { profile, language = 'English' } = req.body || {};
  if (!profile) return safeSend(res, 400, { error: 'profile required' });

  const model = 'gemini-2.5-flash';
  const prompt = `
    You are an expert Resume Writer. Create a high-quality, ATS-Optimized professional resume for the following profile.
    CRITICAL CONSTRAINT: SINGLE PAGE ONLY.
    ... (concise prompt) ...
    Language: ${language}.
    Profile Data: ${JSON.stringify(profile)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.3 }
    });
    return safeSend(res, 200, { text: response.text || '' });
  } catch (err) {
    console.error('generateResume error:', err);
    return safeSend(res, 500, { error: 'GenAI error' });
  }
};

exports.parseResume = async (req, res) => {
  const { text, file } = req.body || {};
  if (!text && !file) return safeSend(res, 400, { error: 'resume text or file required' });

  const model = 'gemini-2.5-flash';
  const prompt = `Extract structured resume JSON matching the expected schema.`;

  const contents = text ? { parts: [{ text: prompt }, { text: `Resume Text: ${text}` }] } :
    { parts: [{ inlineData: { mimeType: file.mimeType, data: file.data } }, { text: prompt }] };

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            education: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              degree: { type: Type.STRING },
              institution: { type: Type.STRING },
              year: { type: Type.STRING },
              score: { type: Type.STRING }
            } } },
            experience: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              role: { type: Type.STRING },
              company: { type: Type.STRING },
              duration: { type: Type.STRING },
              description: { type: Type.STRING }
            } } },
            projects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              techStack: { type: Type.STRING }
            } } }
          }
        }
      }
    });

    const parsed = response.text ? JSON.parse(response.text) : {};
    return safeSend(res, 200, { parsed });
  } catch (err) {
    console.error('parseResume error:', err);
    return safeSend(res, 500, { error: 'GenAI parse error' });
  }
};

exports.analyzeATS = async (req, res) => {
  const { text, file, jobDescription } = req.body || {};
  if (!jobDescription) return safeSend(res, 400, { error: 'jobDescription required' });
  if (!text && !file) return safeSend(res, 400, { error: 'resume text or file required' });

  const model = 'gemini-2.5-flash';
  const systemPrompt = `Act as an algorithmic ATS scanner... Job Description: ${jobDescription.substring(0,3000)}`;

  const contents = text ? { parts: [{ text: systemPrompt }, { text: `Resume Content: ${text.substring(0,5000)}` }] } :
    { parts: [{ inlineData: { mimeType: file.mimeType, data: file.data } }, { text: systemPrompt }] };

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ['score', 'missingKeywords', 'formattingIssues', 'contentSuggestions', 'summary']
        }
      }
    });

    const parsed = response.text ? JSON.parse(response.text) : {};
    return safeSend(res, 200, parsed);
  } catch (err) {
    console.error('analyzeATS error:', err);
    return safeSend(res, 500, { error: 'GenAI ATS error' });
  }
};

exports.analyzeSkillGap = async (req, res) => {
  const { currentSkills = [], targetRole = '' } = req.body || {};
  if (!targetRole) return safeSend(res, 400, { error: 'targetRole required' });

  const model = 'gemini-2.5-flash';
  const prompt = `Analyze the skill gap for target role "${targetRole}". Current Skills: ${currentSkills.join(', ')}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            strongSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            learningPath: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              week: { type: Type.NUMBER },
              topic: { type: Type.STRING },
              resources: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionItem: { type: Type.STRING }
            } } }
          }
        }
      }
    });

    const parsed = response.text ? JSON.parse(response.text) : {};
    return safeSend(res, 200, parsed);
  } catch (err) {
    console.error('analyzeSkillGap error:', err);
    return safeSend(res, 500, { error: 'GenAI skill gap error' });
  }
};

exports.chat = async (req, res) => {
  const { history = [], role = 'Software Engineer', message = '' } = req.body || {};
  if (!message) return safeSend(res, 400, { error: 'message required' });

  const model = 'gemini-2.5-flash';
  const systemInstruction = `You are a professional Interviewer conducting an interview for the role of ${role}. Ask one relevant question at a time.`;

  // Build contents: include system instruction, history, and latest user message
  const parts = [{ text: systemInstruction }];
  history.forEach(h => parts.push({ text: `${h.role}: ${h.text}` }));
  parts.push({ text: `user: ${message}` });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { temperature: 0.3 }
    });
    return safeSend(res, 200, { text: response.text || '' });
  } catch (err) {
    console.error('chat error:', err);
    return safeSend(res, 500, { error: 'GenAI chat error' });
  }
};
