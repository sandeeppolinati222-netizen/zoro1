import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  // Module 1: Interview Simulator
  async generateInterviewQuestion(type: 'HR' | 'Technical', context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are an expert ${type} interviewer. Based on this context: ${context}, ask one challenging and relevant interview question. Keep it concise.`,
    });
    return response.text;
  },

  async evaluateInterviewAnswer(question: string, answer: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Evaluate this interview answer.
      Question: ${question}
      Answer: ${answer}
      Provide a score out of 100 and detailed feedback in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "feedback", "suggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // Module 2: Resume Analyzer
  async analyzeResume(resumeText: string, jobDescription: string = "") {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze this resume text. ${jobDescription ? `Target Job: ${jobDescription}` : ""}
      Resume: ${resumeText}
      Provide an ATS score (0-100), formatting feedback, keyword analysis, and missing keywords in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.NUMBER },
            formattingFeedback: { type: Type.STRING },
            keywordAnalysis: { type: Type.STRING },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["atsScore", "formattingFeedback", "keywordAnalysis", "missingKeywords", "improvementTips"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // Module 3: Coding Evaluator
  async evaluateCode(problem: string, code: string, language: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Evaluate this coding solution.
      Problem: ${problem}
      Language: ${language}
      Code: ${code}
      Analyze logic, time/space complexity, and provide an optimized solution in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            logicFeedback: { type: Type.STRING },
            timeComplexity: { type: Type.STRING },
            spaceComplexity: { type: Type.STRING },
            optimizedCode: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "logicFeedback", "timeComplexity", "spaceComplexity", "optimizedCode", "suggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // Module 4: Career Path Recommender
  async recommendCareerPath(userData: any) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Based on user data: ${JSON.stringify(userData)}, recommend 3 career paths. 
      For each path, provide a 6-month roadmap, suggested projects, and certifications in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              path: { type: Type.STRING },
              reason: { type: Type.STRING },
              roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
              projects: { type: Type.ARRAY, items: { type: Type.STRING } },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["path", "reason", "roadmap", "projects", "certifications"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  },

  // Module 5: Soft Skills Analyzer
  async analyzeSoftSkills(transcript: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze this speech transcript for soft skills.
      Transcript: ${transcript}
      Detect filler words, measure clarity, sentiment, and provide an improvement plan in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fillerWords: { type: Type.ARRAY, items: { type: Type.STRING } },
            clarityScore: { type: Type.NUMBER },
            sentiment: { type: Type.STRING },
            improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["fillerWords", "clarityScore", "sentiment", "improvementPlan"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // Module 8: Company Specific Predictor
  async predictCompanyQuestions(company: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Predict interview questions and preparation strategy for ${company}.
      Provide common HR and Technical questions and a strategy guide in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicalQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            hrQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategy: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["technicalQuestions", "hrQuestions", "strategy", "tips"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // Module 10: Doubt Solver
  async solveDoubt(query: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a placement mentor. Answer this technical or HR doubt clearly with examples: ${query}`,
    });
    return response.text;
  }
};
