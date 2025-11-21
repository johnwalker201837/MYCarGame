import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// NOTE: In a real app, this would be handled securely. 
// The system prompt requires process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Flag to stop requests if we hit a rate limit
let isRateLimited = false;

export const getBattleCommentary = async (
  logs: string[], 
  playerHp: number, 
  enemyCount: number
): Promise<string> => {
  if (isRateLimited) return "The narrator is observing silently.";

  try {
    if (!process.env.API_KEY) return "Gemini API Key missing. (Simulated commentary: Good move!)";

    const recentLogs = logs.slice(-3).join("\n");
    
    const prompt = `
      You are a sarcastic but helpful Dungeon Master narrating a card game battle.
      Current State:
      - Player HP: ${playerHp}
      - Enemies remaining: ${enemyCount}
      - Recent Actions:
      ${recentLogs}

      Give a one-sentence comment on the current situation. Be brief, witty, or offer a tiny strategic tip.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "The battle rages on...";
  } catch (error: any) {
    // Gracefully handle quota exhaustion
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
        console.warn("Gemini Quota Exceeded. Disabling commentary for this session.");
        isRateLimited = true;
        return "The narrator has retreated to the void.";
    }
    console.error("Gemini Error:", error);
    return "The spirits are silent right now...";
  }
};

export const generateDynamicCardName = async (theme: string): Promise<string> => {
    if (isRateLimited) return `Mystic ${theme}`;
    try {
        if (!process.env.API_KEY) return `Mystic ${theme}`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a cool, fantasy card name based on the theme: ${theme}. Return ONLY the name.`,
        });
        return response.text.trim() || `Ancient ${theme}`;
    } catch (e: any) {
        if (e.status === 429 || (e.message && e.message.includes('429'))) {
             isRateLimited = true;
        }
        return `Ancient ${theme}`;
    }
}