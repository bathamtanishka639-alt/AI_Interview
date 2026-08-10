export interface LLMResponse {
  content: string;
  provider: 'gemini' | 'intelligent-local';
  error?: string;
}

export class LLMService {
  private static readonly MODEL = 'gemini-3.5-flash-lite';
  private static readonly BASE_URL =
    'https://generativelanguage.googleapis.com/v1beta/models';

  public static async generateCompletion(
    systemPrompt: string | { systemPrompt: string; prompt?: string; userPrompt?: string; maxTokens?: number },
    userPrompt?: string,
    maxTokens: number = 800
  ): Promise<LLMResponse> {
    let sys = '';
    let usr = '';
    let tokens = maxTokens;

    if (typeof systemPrompt === 'object') {
      sys = systemPrompt.systemPrompt || '';
      usr = systemPrompt.userPrompt || systemPrompt.prompt || '';
      tokens = systemPrompt.maxTokens || maxTokens;
    } else {
      sys = systemPrompt;
      usr = userPrompt || '';
    }

    return LLMService.callGemini(sys, usr, tokens, undefined);
  }

  public static async generateStructuredCompletion(
    systemPrompt: string | { systemPrompt: string; prompt?: string; userPrompt?: string; responseSchema?: object; maxTokens?: number },
    userPrompt?: string | object,
    responseSchema?: object | number,
    maxTokens: number = 800
  ): Promise<LLMResponse> {
    let sys = '';
    let usr = '';
    let schema: object | undefined = undefined;
    let tokens = maxTokens;

    if (typeof systemPrompt === 'object') {
      sys = systemPrompt.systemPrompt || '';
      usr = systemPrompt.userPrompt || systemPrompt.prompt || '';
      schema = systemPrompt.responseSchema || (typeof userPrompt === 'object' ? userPrompt as object : undefined);
      tokens = systemPrompt.maxTokens || maxTokens;
    } else {
      sys = systemPrompt;
      usr = typeof userPrompt === 'string' ? userPrompt : '';
      if (typeof responseSchema === 'object') {
        schema = responseSchema;
      }
      if (typeof responseSchema === 'number') {
        tokens = responseSchema;
      }
    }

    return LLMService.callGemini(sys, usr, tokens, schema);
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
      return { content: '', provider: 'intelligent-local', error: 'No Gemini API keys configured in process.env' };
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

    let lastErr = '';

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const endpoint = `${LLMService.BASE_URL}/${LLMService.MODEL}:generateContent?key=${key}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key
          },
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
          lastErr = `Key #${i + 1} HTTP ${response.status}: ${errText.substring(0, 150)}`;
          console.warn(`[LLMService] ${lastErr}`);
        }
      } catch (err: any) {
        lastErr = `Key #${i + 1} request failed: ${err.message}`;
        console.warn(`[LLMService] ${lastErr}`);
      }
    }

    return { content: '', provider: 'intelligent-local', error: lastErr || 'All Gemini API keys failed' };
  }
}
