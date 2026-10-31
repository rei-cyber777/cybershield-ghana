export type CyberAiModelId =
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.8-flash'
  | 'gemini-4-argon';

export type CyberAiRoleId =
  | 'scam_analyst'
  | 'incident_responder'
  | 'student_advisor';

export interface CyberAiMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface CyberAiModelOption {
  id: CyberAiModelId;
  label: string;
  tierLabel: string;
  description: string;
}

export interface CyberAiRoleOption {
  id: CyberAiRoleId;
  title: string;
  badge: string;
  summary: string;
  starterPrompts: string[];
  roleInstruction: string;
}

export const CYBER_AI_MODELS: CyberAiModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Fast Triage',
    tierLabel: 'gemini-3.1-flash-lite',
    description: 'Fast responses for quick SMS, WhatsApp, and MoMo red-flag checks.',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'General Defense',
    tierLabel: 'gemini-3.8-flash',
    description: 'Balanced multi-turn guidance for everyday scam analysis and safety steps.',
  },
  {
    id: 'gemini-4-argon',
    label: 'Complex Analysis',
    tierLabel: 'gemini-4-argon',
    description: 'Deep reasoning for multi-stage social engineering, phishing URLs, and incident recovery.',
  },
];

export const CYBER_AI_ROLES: CyberAiRoleOption[] = [
  {
    id: 'scam_analyst',
    title: 'Scam & MoMo Fraud Analyst',
    badge: 'Fraud Detection',
    summary:
      'Inspects suspicious SMS, WhatsApp messages, Mobile Money reversal tricks, and fake bank alerts.',
    starterPrompts: [
      'A caller says they mistakenly sent GHS 450 to my MoMo and asked me to dial *170# to reverse it. Is this a scam?',
      'How can I tell if an SMS claiming my Ghana Card link expired is phishing?',
      'Someone on Telegram promised 40% daily returns on a crypto MoMo investment. Break down the red flags.',
    ],
    roleInstruction:
      'Act as a specialist Ghanaian Scam & Mobile Money Fraud Analyst. Dissect suspicious messages, callers, USSD prompts, and payment requests step by step. Highlight exact manipulation tactics (urgency, impersonation, advance-fee traps, OTP theft) and give a clear Risk Verdict (Low, Medium, High, or Critical).',
  },
  {
    id: 'incident_responder',
    title: 'Emergency Incident Coach',
    badge: 'Rapid Response',
    summary:
      'Step-by-step action plan if you already shared a PIN/OTP, clicked a phishing link, or sent money.',
    starterPrompts: [
      'I just shared my 6-digit WhatsApp verification code with a stranger. What do I do right now?',
      'I sent Mobile Money to a scammer 10 minutes ago. Who should I contact immediately in Ghana?',
      'I entered my email password on a fake scholarship portal. Help me lock down my accounts.',
    ],
    roleInstruction:
      'Act as a calm, urgent Cybersecurity Incident Response Coach for users in Ghana. Prioritize immediate containment steps in numbered order: 1) Securing Mobile Money wallets and changing PINs immediately, 2) Enabling Two-Step Verification on WhatsApp/email, 3) Contacting official channels (CSA Ghana shortcode 292, MTN 100, Telecel 100, AT 100, or Bank of Ghana / Ghana Police Cybercrime Unit). Never blame the victim.',
  },
  {
    id: 'student_advisor',
    title: 'Student & Job Opportunity Verifier',
    badge: 'Opportunity Bridge',
    summary:
      'Helps students verify scholarships, remote internships, visa agents, and recruitment offers.',
    starterPrompts: [
      'An agent asked me to pay GHS 350 via MoMo for a Canadian scholarship "processing form". How do I verify this?',
      'What are the signs of a fake remote job or internship targeting Ghanaian university students?',
      'How do I check if a company domain and recruiter email are legitimate before sending my CV?',
    ],
    roleInstruction:
      'Act as the Opportunity Bridge Student & Career Security Advisor. Help Ghanaian students and job seekers evaluate scholarships, internships, recruitment messages, and travel agents. Emphasize that legitimate scholarships do not demand Mobile Money processing fees to personal numbers, and teach practical verification checks (official university domains, embassy portals, and independent verification).',
  },
];

const BASE_SYSTEM_INSTRUCTION = `You are Cyber AI, the multi-turn cybersecurity defense assistant built into CyberShield Ghana.
Your mission is to protect Ghanaians from Mobile Money (MoMo) fraud, WhatsApp account hijacking, phishing links, fake scholarships, romance scams, and investment fraud.

Core operating rules:
1. Never ask the user to share their actual Mobile Money PIN, one-time password (OTP), bank password, or full card number in this chat.
2. When referencing official reporting channels in Ghana, cite accurate contacts: Cyber Security Authority (CSA) Ghana shortcode 292 (or report@csa.gov.gh / +233 59 691 3680), MTN Ghana official line 100, Telecel Ghana 100, AT Ghana 100, and the Ghana Police Service Cybercrime Unit.
3. Keep responses structured, practical, and easy to scan using short paragraphs and bullet points.
4. Maintain multi-turn context from earlier messages in the conversation thread.`;

export function isValidCyberAiModel(model: unknown): model is CyberAiModelId {
  return (
    model === 'gemini-3.1-flash-lite' ||
    model === 'gemini-3.8-flash' ||
    model === 'gemini-4-argon'
  );
}

export function isValidCyberAiRole(role: unknown): role is CyberAiRoleId {
  return (
    role === 'scam_analyst' ||
    role === 'incident_responder' ||
    role === 'student_advisor'
  );
}

export function buildCyberAiSystemInstruction(roleId: CyberAiRoleId): string {
  const roleObj =
    CYBER_AI_ROLES.find((r) => r.id === roleId) ?? CYBER_AI_ROLES[0];
  return `${BASE_SYSTEM_INSTRUCTION}\n\nActive Specialist Role — ${roleObj.title}:\n${roleObj.roleInstruction}`;
}

/**
 * Sanitizes client-supplied chat history into the exact format expected by
 * `@google/genai` `ai.chats.create({ history })`.
 * Gemini requires history to start with a 'user' turn and alternate cleanly.
 */
export function sanitizeChatHistoryForGemini(
  rawHistory: unknown,
  maxTurns = 20
): GeminiHistoryEntry[] {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  const cleaned: GeminiHistoryEntry[] = [];
  for (const item of rawHistory.slice(-maxTurns)) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const role = rec.role === 'user' || rec.role === 'model' ? rec.role : null;
    const text = typeof rec.text === 'string' ? rec.text.trim() : '';
    if (!role || !text) continue;

    const clippedText = text.slice(0, 4000);
    // Ensure history starts with a 'user' message
    if (cleaned.length === 0 && role !== 'user') {
      continue;
    }

    // Merge consecutive messages with the same role to satisfy strict turn alternation
    const prev = cleaned[cleaned.length - 1];
    if (prev && prev.role === role) {
      prev.parts[0].text = `${prev.parts[0].text}\n\n${clippedText}`.slice(0, 4000);
    } else {
      cleaned.push({
        role,
        parts: [{ text: clippedText }],
      });
    }
  }

  // If the last message in history is from 'user', drop it because the new user message
  // will be sent via `chat.sendMessage({ message })`
  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
    cleaned.pop();
  }

  return cleaned;
}

export interface ValidatedCyberAiRequest {
  ok: boolean;
  error?: string;
  message: string;
  model: CyberAiModelId;
  role: CyberAiRoleId;
  history: GeminiHistoryEntry[];
}

export function validateCyberAiRequest(body: unknown): ValidatedCyberAiRequest {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const rawMessage = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!rawMessage) {
    return {
      ok: false,
      error: 'Please enter a question or paste a suspicious message for Cyber AI to analyze.',
      message: '',
      model: 'gemini-3.8-flash',
      role: 'scam_analyst',
      history: [],
    };
  }

  if (rawMessage.length > 4000) {
    return {
      ok: false,
      error: 'Message is too long (maximum 4,000 characters). Please shorten the text and try again.',
      message: '',
      model: 'gemini-3.8-flash',
      role: 'scam_analyst',
      history: [],
    };
  }

  const model: CyberAiModelId = isValidCyberAiModel(payload.model)
    ? payload.model
    : 'gemini-3.8-flash';
  const role: CyberAiRoleId = isValidCyberAiRole(payload.role)
    ? payload.role
    : 'scam_analyst';
  const history = sanitizeChatHistoryForGemini(payload.history);

  return {
    ok: true,
    message: rawMessage,
    model,
    role,
    history,
  };
}
