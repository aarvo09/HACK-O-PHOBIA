import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export interface AttendanceResult {
  headcount: number;
  status: string;
  notes: string;
  presentStudentIds: string[];
  discrepancyFound: boolean;
  analysis: string;
}

/**
 * Analyzes a classroom image using Gemini Pro Vision
 */
export async function analyzeClassroomImage(
  base64Data: string,
  mimeType: string,
  expectedStudents?: { rollNumber: string; name?: string }[]
): Promise<AttendanceResult> {
  const allRollNumbers = expectedStudents?.map((s) => s.rollNumber).filter(Boolean) || [];

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Returning mock data.");
    const randomHeadcount = Math.min(Math.floor(Math.random() * 5) + 20, allRollNumbers.length || 25);
    return {
      headcount: randomHeadcount,
      status: "attentive",
      notes: "Mock data generated because API key is missing.",
      presentStudentIds: allRollNumbers.slice(0, randomHeadcount),
      discrepancyFound: false,
      analysis: "Mock analysis: Class behavior is normal."
    };
  }

  try {
    const geminiClient = getGeminiClient();
    if (!geminiClient) {
      throw new Error("Gemini client unavailable");
    }
    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI classroom monitoring assistant. 
      Analyze this image of a classroom and provide the following:
      1. An estimate of the total number of students present.
      2. Are they seated and paying attention?
      3. We expect the following students to be in this class: ${JSON.stringify(expectedStudents || [])}. 
        Based on your headcount estimate, simulate which of these students are present by including their roll numbers in the "presentStudentIds" array. Provide exactly as many roll numbers as your estimated headcount.
      4. Return exactly and only JSON format like this: 
      { "headcount": 25, "status": "attentive", "notes": "Students are focused.", "presentStudentIds": ["DS101", "DS102"] }
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("Raw Gemini Response:", responseText);

    // Try to parse the JSON output (Gemini sometimes wraps it in markdown blocks)
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [null, responseText];
    const rawJson = jsonMatch[1] || responseText;
    
    const parsed = JSON.parse(rawJson);
    const normalizedPresentIds = Array.isArray(parsed.presentStudentIds)
      ? parsed.presentStudentIds.map((v: unknown) => String(v).trim()).filter(Boolean)
      : [];

    return {
      headcount: typeof parsed.headcount === 'number' ? parsed.headcount : parseInt(String(parsed.headcount)) || 0,
      status: String(parsed.status || "unknown"),
      notes: String(parsed.notes || ""),
      presentStudentIds: normalizedPresentIds,
      discrepancyFound: parsed.headcount < (expectedStudents?.length || 0) * 0.8, // Example logic
      analysis: String(parsed.notes || "No analysis available.")
    };
  } catch (error) {
    console.error("Gemini AI API Error:", error);
    throw new Error("Failed to analyze image with Gemini API");
  }
}
