import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ResearchResult {
  summary: string;
  sources: { title: string; url: string }[];
}

export async function performResearch(topic: string): Promise<ResearchResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Research and summarize the following topic: ${topic}. Provide a concise but comprehensive summary.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const summary = response.text || "No summary generated.";
  
  // Extract sources from grounding metadata if available
  // Note: The SDK structure for grounding metadata might vary, 
  // but usually it's in candidates[0].groundingMetadata
  const sources: { title: string; url: string }[] = [];
  const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
  
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.title && chunk.web?.uri) {
        sources.push({
          title: chunk.web.title,
          url: chunk.web.uri
        });
      }
    });
  }

  // Deduplicate sources
  const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());

  return {
    summary,
    sources: uniqueSources,
  };
}

export async function generateReport(topic: string, researchData: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following research data, generate a professional, structured report on "${topic}". 
    Include sections like Executive Summary, Key Findings, Detailed Analysis, and Conclusion.
    Use Markdown for formatting.
    
    Research Data:
    ${researchData}`,
  });

  return response.text || "Failed to generate report.";
}
