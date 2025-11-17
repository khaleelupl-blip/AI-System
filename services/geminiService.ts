
import { GoogleGenAI, Type } from "@google/genai";
import { AdminSettings } from '../types';

// This function simulates fetching suggestions. In a real app, this would make an API call.
export const getAIConfigurationSuggestion = async (projectContext: string): Promise<AdminSettings & { reasoning: Record<string, string> }> => {
    
    if (!process.env.API_KEY) {
        console.warn("API_KEY environment variable not set. Returning mock data.");
        // Mock response if API key is not available
        return Promise.resolve({
            radiusInMeters: 150,
            workingHoursStart: '07:00',
            workingHoursEnd: '19:00',
            allowEmployeeLocationView: true,
            reasoning: {
                radius: "For a typical urban construction site, a 150m radius provides a good balance between accuracy and flexibility for workers.",
                workingHours: "Construction work often starts early to take advantage of daylight. A 7 AM to 7 PM schedule is common for such projects.",
                locationView: "Allowing employees to see their location accuracy helps them troubleshoot check-in issues, fostering transparency."
            }
        });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `
            You are an expert HR and Operations consultant specializing in construction projects. 
            Based on the following project context, recommend optimal settings for an employee attendance system. 
            Provide your answer in a strict JSON format only. Do not add any commentary or markdown formatting around the JSON.

            Context: "${projectContext}"

            The JSON object must have these exact keys and value types:
            - "radiusInMeters": (number) The recommended attendance radius in meters.
            - "radiusReasoning": (string) A brief explanation for the recommended radius.
            - "workingHoursStart": (string, HH:mm format) Recommended start time.
            - "workingHoursEnd": (string, HH:mm format) Recommended end time.
            - "workingHoursReasoning": (string) A brief explanation for the hours.
            - "allowEmployeeLocationView": (boolean) Recommendation on whether employees should see their location accuracy details.
            - "locationViewReasoning": (string) A brief explanation for the location view setting.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        radiusInMeters: { type: Type.INTEGER },
                        radiusReasoning: { type: Type.STRING },
                        workingHoursStart: { type: Type.STRING },
                        workingHoursEnd: { type: Type.STRING },
                        workingHoursReasoning: { type: Type.STRING },
                        allowEmployeeLocationView: { type: Type.BOOLEAN },
                        locationViewReasoning: { type: Type.STRING },
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const suggestion = JSON.parse(jsonText);

        return {
            radiusInMeters: suggestion.radiusInMeters,
            workingHoursStart: suggestion.workingHoursStart,
            workingHoursEnd: suggestion.workingHoursEnd,
            allowEmployeeLocationView: suggestion.allowEmployeeLocationView,
            reasoning: {
                radius: suggestion.radiusReasoning,
                workingHours: suggestion.workingHoursReasoning,
                locationView: suggestion.locationViewReasoning,
            }
        };

    } catch (error) {
        console.error("Error fetching AI suggestion:", error);
        throw new Error("Failed to get AI-powered suggestions. Please check your API key and network connection.");
    }
};
