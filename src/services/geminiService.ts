import { GoogleGenAI, Type } from "@google/genai";
import { GradeLevel, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getAssignmentHelp = async (subject: string, topic: string, instructions: string, gradeLevel: GradeLevel) => {
  const model = "gemini-3-flash-preview";
  const prompt = `As an academic assistant for a ${gradeLevel} student, help with the following assignment:
    Subject: ${subject}
    Topic: ${topic}
    Instructions: ${instructions}
    
    Provide:
    1. A clear explanation of the core concepts.
    2. A step-by-step solution or guide.
    3. An example answer or template.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          example: { type: Type.STRING }
        },
        required: ["explanation", "steps", "example"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getResearchAssistant = async (topic: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Provide research assistance for the topic: ${topic}.
    Include:
    1. 3-5 suggested research titles.
    2. 3-5 key research questions.
    3. A detailed outline (chapter structure).
    4. Methodology suggestions.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titles: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions: { type: Type.ARRAY, items: { type: Type.STRING } },
          outline: { type: Type.ARRAY, items: { 
            type: Type.OBJECT, 
            properties: {
              chapter: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }},
          methodology: { type: Type.STRING }
        },
        required: ["titles", "questions", "outline", "methodology"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getStudyExplanation = async (topic: string, difficulty: Difficulty) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Explain the topic "${topic}" at a ${difficulty} level.
    If simple: use analogies and basic language.
    If detailed: provide comprehensive coverage with examples.
    If advanced: include technical details, current research, and complex implications.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
};
