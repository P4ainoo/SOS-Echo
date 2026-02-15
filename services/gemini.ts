
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `You are SafeLens AI — an AI-powered real-time aggression detection and safety alert system for schools and institutions.
Your primary mission is the immediate detection of physical violence, fighting, and hitting.

OBJECTIVE:
Detect escalating physical aggression, harassment, or violent behavior. 
If you see two people fighting, someone striking another, or someone being pushed forcefully, this is a CRITICAL safety violation.

REPORTING & FACE DETECTION:
When an incident is detected:
1. Provide a detailed incident_summary.
2. Detect the coordinates of any visible faces involved in the incident to assist security identification. 
   Return them in detected_faces as [ymin, xmin, ymax, xmax] normalized 0-1000.

RULES:
- Do NOT perform facial recognition (identifying specific people by name). Just detect and locate faces.
- Focus on posture, movement, proximity, and interaction.
- REDUCE false positives for non-aggressive physical contact (like high-fives or hugs).

ANALYSIS:
- Look for: Raised fists, striking motions, hitting, kicking, wrestling, pinning someone.
- If violence is occurring, assign Aggression Score > 90 and Risk Level "critical".

Return JSON strictly matching the provided schema.`;

export const analyzeFrame = async (base64Image: string): Promise<AIResponse> => {
  // Always use process.env.API_KEY directly in the constructor as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Using gemini-3-flash-preview for efficient vision analysis and reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: "CRITICAL SAFETY CHECK: Is there a fight, hitting, or physical violence occurring? If so, generate a report, detect faces of those involved, and return details." }
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aggression_score: { type: Type.INTEGER },
            escalation_probability: { type: Type.INTEGER },
            risk_level: { type: Type.STRING },
            escalation_trend: { type: Type.STRING },
            observed_behaviors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            possible_distress_detected: { type: Type.BOOLEAN },
            alert_recommended: { type: Type.BOOLEAN },
            admin_alert_message: { type: Type.STRING },
            confidence_score: { type: Type.INTEGER },
            incident_summary: { type: Type.STRING },
            detected_faces: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER }
                  },
                  label: { type: Type.STRING }
                }
              }
            }
          },
          required: [
            "aggression_score", 
            "escalation_probability", 
            "risk_level", 
            "escalation_trend", 
            "observed_behaviors", 
            "possible_distress_detected", 
            "alert_recommended", 
            "admin_alert_message", 
            "confidence_score"
          ]
        },
      },
    });

    // Accessing response.text as a property
    const result = JSON.parse(response.text || "{}");
    return result as AIResponse;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};
