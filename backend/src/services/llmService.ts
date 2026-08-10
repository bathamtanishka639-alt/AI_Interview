export interface LLMResponse {
  content: string;
  provider: 'gemini' | 'intelligent-local';
}

export class LLMService {
  private static readonly MODEL = 'gemini-2.0-flash';
  private static readonly BASE_URL =
    'https://generativelanguage.googleapis.com/v1beta/models';

  public static async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 800
  ): Promise<LLMResponse> {
    return LLMService.callGemini(systemPrompt, userPrompt, maxTokens, undefined);
  }

  public static async generateStructuredCompletion(
    systemPrompt: string,
    userPrompt: string,
    responseSchema: object,
    maxTokens: number = 800
  ): Promise<LLMResponse> {
    return LLMService.callGemini(systemPrompt, userPrompt, maxTokens, responseSchema);
  }

  private static getApiKeys(): string[] {
    const raw = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_SECONDARY,
      process.env.GOOGLE_API_KEY
    ].filter(Boolean).join(',');

    return raw
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
  }

  private static async callGemini(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    responseSchema: object | undefined
  ): Promise<LLMResponse> {
    const keys = LLMService.getApiKeys();
    if (!keys.length) {
      return { content: '', provider: 'intelligent-local' };
    }

    const generationConfig: Record<string, any> = {
      maxOutputTokens: maxTokens,
      temperature: 0.1,
      topP: 0.85
    };

    if (responseSchema) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = responseSchema;
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const endpoint = `${LLMService.BASE_URL}/${LLMService.MODEL}:generateContent?key=${key}`;
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
            `[LLMService] Key #${i + 1} HTTP ${response.status}: ${errText.substring(0, 150)}`
          );
        }
      } catch (err: any) {
        console.warn(`[LLMService] Key #${i + 1} request failed: ${err.message}`);
      }
    }

    return { content: '', provider: 'intelligent-local' };
  }
}
