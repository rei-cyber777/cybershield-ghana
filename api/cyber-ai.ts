import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ApiRequest, ApiResponse, parseJsonBody, sendJson } from './_utils';
import {
  buildCyberAiSystemInstruction,
  validateCyberAiRequest,
} from '../src/lib/cyberAiCore';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed. Use POST.' });
    return;
  }

  const body = await parseJsonBody(req);
  const validated = validateCyberAiRequest(body);

  if (!validated.ok) {
    sendJson(res, 400, { ok: false, error: validated.error });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    sendJson(res, 503, {
      ok: false,
      error:
        'GEMINI_API_KEY is not configured on the server. Please check the Settings > Secrets panel.',
    });
    return;
  }

  const systemInstruction = buildCyberAiSystemInstruction(validated.role);
  let activeModel = validated.model;

  try {
    const chat = ai.chats.create({
      model: activeModel,
      history: validated.history,
      config: {
        systemInstruction,
      },
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: validated.message,
    });

    const replyText = (response.text || '').trim();
    sendJson(res, 200, {
      ok: true,
      reply:
        replyText ||
        'I analyzed your message, but no text output was returned. Please rephrase and try again.',
      modelUsed: activeModel,
    });
  } catch (primaryError: unknown) {
    // If gemini-4-argon was requested without a billing-enabled API key, gracefully
    // fall back to gemini-3.8-flash so multi-turn chat works seamlessly on free-tier keys.
    if (activeModel === 'gemini-4-argon') {
      try {
        activeModel = 'gemini-3.8-flash';
        const fallbackChat = ai.chats.create({
          model: activeModel,
          history: validated.history,
          config: {
            systemInstruction,
          },
        });
        const fallbackResponse: GenerateContentResponse = await fallbackChat.sendMessage({
          message: validated.message,
        });
        const fallbackText = (fallbackResponse.text || '').trim();
        if (fallbackText) {
          sendJson(res, 200, {
            ok: true,
            reply: fallbackText,
            modelUsed: activeModel,
            fallbackNotice:
              'Answered using gemini-3.8-flash (select a paid API key in Settings > Secrets to enable gemini-4-argon).',
          });
          return;
        }
      } catch {
        // Proceed to standard error reporting below
      }
    }

    const errMsg =
      primaryError instanceof Error ? primaryError.message : String(primaryError);
    console.error('[Cyber AI] Gemini API error:', errMsg);

    if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID')) {
      sendJson(res, 403, {
        ok: false,
        error:
          'Gemini API key permission error. Please check your API key in the Settings > Secrets panel.',
      });
      return;
    }

    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      sendJson(res, 429, {
        ok: false,
        error:
          'Gemini API rate limit reached. Upgrading to a paid tier in Settings > Secrets increases your quota.',
      });
      return;
    }

    sendJson(res, 500, {
      ok: false,
      error: 'Cyber AI encountered an unexpected error processing your request. Please try again.',
    });
  }
}
