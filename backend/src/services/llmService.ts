export interface LLMResponse {
  content: string;
  provider: 'gemini' | 'intelligent-local';
}

export class LLMService {
  private static readonly MODEL = 'gemini-2.0-flash';
  private static readonly BASE_URL =
    'https://generativelanguage.googleapis.com/v1beta/models';

  /**
   * Standard text completion — used for feedback generation, summaries, etc.
   */
  public static async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 800
  ): Promise<LLMResponse> {
    return LLMService.callGemini(systemPrompt, userPrompt, maxTokens, undefined);
  }

  /**
   * Structured JSON completion — forces the model to emit a JSON object that
   * strictly conforms to the provided JSON Schema (Gemini responseSchema).
   * This is the SINGLE-CALL pattern used by the orchestration engine.
   * No markdown fences, no prose — pure JSON object, always.
   */
  public static async generateStructuredCompletion(
    systemPrompt: string,
    userPrompt: string,
    responseSchema: object,
    maxTokens: number = 800
  ): Promise<LLMResponse> {
    return LLMService.callGemini(systemPrompt, userPrompt, maxTokens, responseSchema);
  }

  private static async callGemini(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    responseSchema: object | undefined
  ): Promise<LLMResponse> {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key || !key.trim()) {
      return { content: '', provider: 'intelligent-local' };
    }

    const generationConfig: Record<string, any> = {
      maxOutputTokens: maxTokens
    };

    if (responseSchema) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = responseSchema;
    }

    try {
      const endpoint = `${LLMService.BASE_URL}/${LLMService.MODEL}:generateContent?key=${key.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return { content: text, provider: 'gemini' };
      } else {
        const errText = await response.text();
        console.warn(
          `[LLMService] Gemini HTTP ${response.status}: ${errText.substring(0, 200)}`
        );
      }
    } catch (err: any) {
      console.warn(`[LLMService] Gemini request failed: ${err.message}`);
    }

    return { content: '', provider: 'intelligent-local' };
  }
}
