
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SurveyData, CareerSuggestion, Message } from "../types";

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (userName: string = 'User', history: Message[] = []): Chat => {
  const ai = getAIClient();
  
  // Filter and map existing messages to the format expected by the Gemini API.
  // We exclude purely UI messages or those marked as 'streaming' to ensure a valid history.
  // We also limit the history to the last 15 messages to prevent hitting token limits.
  const geminiHistory = history
    .filter(msg => !msg.isStreaming && msg.text.trim() !== '')
    .slice(-15)
    .map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

  return ai.chats.create({
    model: 'gemini-3.1-pro-preview',
    history: geminiHistory,
    config: {
      maxOutputTokens: 2048,
      systemInstruction: `You are a professional, highly knowledgeable career counselor. Address the user as ${userName}. 
      Provide detailed, comprehensive, and accurate career advice. 
      When the user asks about a career, skills, or a roadmap, provide a well-structured response with concise paragraphs (about 2-3 sentences each). 
      Aim for high-quality information but keep the paragraphs focused and easy to read. 
      Include specific steps, recommended certifications, industry trends, and practical tips. 
      Be concise and avoid long walls of text. 
      Always ensure the information is factually correct and up-to-date with current industry standards.`,
    },
  });
};

export const analyzeCareer = async (data: SurveyData): Promise<CareerSuggestion> => {
  const ai = getAIClient();
  
  let surveyContext = "";
  if (data.surveyResponses) {
    const mcqs = data.surveyResponses.mcqs.map(m => `${m.question}: ${m.answer}`).join("\n");
    const open = data.surveyResponses.openEnded.map(o => `${o.question}: ${o.answer}`).join("\n");
    surveyContext = `
      User Survey Responses:
      MCQs:
      ${mcqs}
      
      Detailed Answers:
      ${open}
    `;
  }

  // Determine if we are generating for a specific target role or discovering one
  const targetRoleText = data.preferredRole 
    ? `TARGET ROLE: ${data.preferredRole} (Industry: ${data.preferredIndustry || 'General'})\nIMPORTANT: You MUST generate the roadmap specifically for this role.`
    : "Based on the user's profile, suggest the BEST matching career path.";

  const prompt = `
    ${targetRoleText}
    
    User Profile Context:
    - Qualification: ${data.qualification || 'Not specified'}
    - Interests: ${data.interests || 'Not specified'}
    - Hobbies: ${data.hobbies || 'Not specified'}
    - Knowledge/Skills: ${data.knowledge || 'Not specified'}
    
    ${surveyContext}

    Strict JSON Format:
    - careerName: The exact job title (use the TARGET ROLE if provided).
    - reasoning: A brief, encouraging explanation of why this path fits. Use second-person "You".
    - requirements: Max 3 market requirements.
    - coreConcepts: Max 4 keywords.
    - roadmap: Exact 4-5 steps. 
    - schoolingPathAdvice: Optional academic tips.
    - isMeaningless: Set to true ONLY if the user's open-ended responses are random, gibberish, or meaningless typing (e.g. 'asdfasdf', '123123').
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      maxOutputTokens: 2048,
      systemInstruction: "You are a specialized career analyst. Address the user directly using 'You'. If a TARGET ROLE is specified, your entire response must focus on that specific career. You must return only valid JSON. If the user's open-ended survey responses are random, gibberish, or meaningless typing (e.g. 'asdfasdf', '123123'), set 'isMeaningless' to true and provide a generic response for the other fields.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          careerName: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          isMeaningless: { type: Type.BOOLEAN },
          requirements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          coreConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.STRING }
              },
              required: ["title", "description", "duration"]
            }
          },
          schoolingPathAdvice: { type: Type.STRING }
        },
        required: ["careerName", "confidenceScore", "reasoning", "requirements", "coreConcepts", "roadmap", "isMeaningless"]
      }
    }
  });

  try {
     const text = response.text;
     if (text) {
        return JSON.parse(text);
     }
     throw new Error("Empty response");
  } catch (e) {
      console.error("JSON Parse Error", e);
      // More specific fallback based on preferred role if JSON fails
      const fallbackName = data.preferredRole || "Professional Specialist";
      return {
        careerName: fallbackName,
        confidenceScore: 0.8,
        reasoning: `You show a strong foundation for a career as a ${fallbackName}.`,
        requirements: ["Domain Specific Knowledge", "Continuous Learning"],
        coreConcepts: ["Foundations", "Intermediate Techniques", "Expert Practices"],
        roadmap: [
          { title: "Initial Learning", description: `Acquire the primary skills required for ${fallbackName}.`, duration: "3 months" },
          { title: "Skill Refinement", description: "Practice through hands-on projects and internships.", duration: "6 months" },
          { title: "Professional Certification", description: "Get certified to validate your expertise in the market.", duration: "2 months" },
          { title: "Job Placement", description: "Network and apply for entry-level positions.", duration: "Ongoing" }
        ],
        isMeaningless: false
      };
  }
};
