/**
 * CyberShield Ghana — Rule-Based Scam Risk Engine
 *
 * Designed as a pure, zero-dependency TypeScript module so that a trained
 * Machine Learning classifier (e.g. ONNX / TensorFlow.js / API endpoint) can
 * drop in and replace `evaluateScamRisk()` without changing the UI contract.
 */

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface RedFlagIndicator {
  id: string;
  category: 'Mobile Money' | 'Investment' | 'Jobs & Scholarships' | 'Phishing & Urgency';
  question: string;
  questionTwi: string;
  weight: number; // 10 to 40 points
  explanation: string;
  nextStep: string;
}

export interface ScamEvaluationInput {
  selectedFlagIds: string[];
  messageText?: string;
  channel?: string;
}

export interface ScamEvaluationResult {
  score: number; // Normalized 0 - 100
  riskLevel: RiskLevel;
  summary: string;
  triggeredFlags: RedFlagIndicator[];
  detectedTextPatterns: string[];
  recommendedActions: string[];
}

export const RED_FLAG_INDICATORS: RedFlagIndicator[] = [
  {
    id: 'momo_pin_or_otp',
    category: 'Mobile Money',
    question: 'Does the caller or message ask for your Mobile Money (MoMo) PIN, OTP code, or ask you to approve a prompt you did not initiate?',
    questionTwi: 'Enti onipa no anaa krataa no rebisa wo MoMo PIN, OTP code, anaa se mia "Approve" wo biribi a wonhyee asee ho?',
    weight: 45,
    explanation: 'No legitimate telecom provider, bank, or agent in Ghana will ever ask for your 4-digit MoMo PIN or 6-digit OTP verification code.',
    nextStep: 'Hang up immediately. Never enter your MoMo PIN to "receive" money or cancel a wrong transfer.',
  },
  {
    id: 'wrong_transfer_reversal',
    category: 'Mobile Money',
    question: 'Did someone claim they "accidentally sent money" to your wallet and pressure you to send it back to a different number right away?',
    questionTwi: 'Obi ka se "mfomsoo mu na omanee wo sika" na orehye wo se mane san ko noma foforo so ntem ara?',
    weight: 30,
    explanation: 'Scammers send fake SMS deposit alerts (from personal numbers instead of official shortcodes) so you send your own real wallet balance to them.',
    nextStep: 'Check your actual MoMo balance by dialing the official USSD code yourself, and ask the sender to contact their telecom network for official reversal.',
  },
  {
    id: 'guaranteed_high_returns',
    category: 'Investment',
    question: 'Does it promise guaranteed high returns (e.g., "Double your GHS in 24–48 hours" or "30% weekly profit with zero risk")?',
    questionTwi: 'Ehye bo se wobenya mfasoo kesee ntem (se ebia "Ma wo sika mmo ho mmienu wo nnonhwere 24 mu")?',
    weight: 35,
    explanation: 'Guaranteed high-yield "flipping" schemes on WhatsApp and Telegram are classic Ponzi or advance-fee scams.',
    nextStep: 'Verify whether the firm is officially licensed by national financial regulators before sending a single pesewa.',
  },
  {
    id: 'scholarship_or_job_fee',
    category: 'Jobs & Scholarships',
    question: 'Are you being asked to pay a "processing fee", "medical fee", "visa slot fee", or "application form fee" via personal Mobile Money for a job or scholarship?',
    questionTwi: 'Worebisa se tua "processing fee", "medical fee", anaa "application fee" fa obi personal MoMo so ansa na wanya adwuma anaa scholarship?',
    weight: 35,
    explanation: 'Genuine scholarships and reputable employers do not collect processing fees into personal Mobile Money wallets.',
    nextStep: 'Cross-check the opportunity on the official university or embassy website, or verify it in a trusted community like Opportunity Bridge.',
  },
  {
    id: 'extreme_urgency_or_threat',
    category: 'Phishing & Urgency',
    question: 'Does the message threaten that your SIM card, Ghana Card link, or bank account will be blocked within minutes unless you click a link?',
    questionTwi: 'Krataa no hunahuna wo se wobesi wo SIM card anaa sikakorabea kwan seesei ara se woammia link bi so a?',
    weight: 25,
    explanation: 'Artificial panic is engineered to stop you from inspecting the sender address or calling official customer service.',
    nextStep: 'Do not click the link. Visit a physical service center or dial the official customer care shortcode printed on your SIM pack.',
  },
  {
    id: 'lookalike_link_or_shortener',
    category: 'Phishing & Urgency',
    question: 'Does it contain a shortened link (bit.ly, tinyurl) or a strange web address pretending to be a bank, government portal, or scholarship board?',
    questionTwi: 'Link tiawa bi (bit.ly, tinyurl) anaa website din foforo bi a ese aban anaa bank dee wom?',
    weight: 25,
    explanation: 'Phishing pages copy official logos to harvest your login passwords, Ghana Card details, or MoMo PIN.',
    nextStep: 'Inspect the exact domain name carefully. Official Ghana government portals end in .gov.gh.',
  },
  {
    id: 'unsolicited_whatsapp_group',
    category: 'Investment',
    question: 'Were you added to a WhatsApp or Telegram group without permission where "members" keep posting screenshots of huge payouts?',
    questionTwi: 'Wode wo kaa WhatsApp anaa Telegram kuw bi ho a woammisa, a nnipa de sika screenshots gu mu?',
    weight: 20,
    explanation: 'Scammers control multiple fake accounts in the same group to stage fabricated payment proofs and create social pressure.',
    nextStep: 'Report and exit the group immediately, and restrict who can add you to WhatsApp groups in Settings > Privacy > Groups.',
  },
  {
    id: 'impersonating_official_on_personal_number',
    category: 'Phishing & Urgency',
    question: 'Is the person claiming to be telecom/bank staff, a protocol officer, or customer care, but calling from a regular 10-digit personal phone number?',
    questionTwi: 'Onipa no se oye telco anaa bank adwumayeni, nanso ode personal noma (digits 10) na erefre wo?',
    weight: 30,
    explanation: 'Fraudsters spoof profile photos with corporate logos on WhatsApp while calling from ordinary prepaid SIM cards.',
    nextStep: 'End the call and dial the official helpline directly to confirm whether any issue exists on your account.',
  },
];

const TEXT_HEURISTIC_PATTERNS: { pattern: RegExp; label: string; bonusScore: number }[] = [
  {
    pattern: /\b(pin|otp|secret\s*code|4\s*digit|verification\s*code)\b/i,
    label: 'Requests sensitive PIN / OTP verification code',
    bonusScore: 30,
  },
  {
    pattern: /\b(double\s+your|guaranteed\s+profit|100%\s+return|investment\s+package|flip\s+cash)\b/i,
    label: 'Promises unrealistic guaranteed financial returns',
    bonusScore: 25,
  },
  {
    pattern: /\b(account\s+suspended|sim\s+blocked|urgent\s+action|within\s+24\s+hours|click\s+below)\b/i,
    label: 'Uses high-pressure urgency or account suspension threats',
    bonusScore: 20,
  },
  {
    pattern: /\b(processing\s+fee|protocol\s+slot|medical\s+fee|send\s+to\s+agent)\b/i,
    label: 'Solicits advance fee for job, scholarship, or protocol placement',
    bonusScore: 25,
  },
  {
    pattern: /(bit\.ly|tinyurl\.com|t\.me\/|wa\.me\/|\.[a-z]{2,4}\/login)/i,
    label: 'Contains shortened or external redirect link',
    bonusScore: 15,
  },
];

/**
 * Pure deterministic evaluation function.
 * Can be unit-tested independently or replaced by an async ML model inference call.
 */
export function evaluateScamRisk(input: ScamEvaluationInput): ScamEvaluationResult {
  const uniqueIds = Array.from(new Set(input.selectedFlagIds || []));
  const triggeredFlags = RED_FLAG_INDICATORS.filter((indicator) =>
    uniqueIds.includes(indicator.id)
  );

  let rawScore = triggeredFlags.reduce((sum, item) => sum + item.weight, 0);

  const detectedTextPatterns: string[] = [];
  const trimmedText = (input.messageText || '').trim();
  if (trimmedText.length > 0) {
    for (const rule of TEXT_HEURISTIC_PATTERNS) {
      if (rule.pattern.test(trimmedText)) {
        detectedTextPatterns.push(rule.label);
        rawScore += rule.bonusScore;
      }
    }
  }

  const score = Math.min(100, Math.max(0, rawScore));

  let riskLevel: RiskLevel = 'Low';
  let summary =
    'No major red flags were triggered yet, but always verify independently before sending money or sharing personal details.';

  if (score >= 70 || uniqueIds.includes('momo_pin_or_otp')) {
    riskLevel = 'Critical';
    summary =
      'Critical Scam Pattern Detected! This matches known high-risk fraud tactics targeting Ghanaians. Stop all communication and do not send money or share any code.';
  } else if (score >= 45) {
    riskLevel = 'High';
    summary =
      'High Risk of Fraud. Multiple warning signs indicate a likely scam. Do not pay any fee or click links until verified through official channels.';
  } else if (score >= 20) {
    riskLevel = 'Moderate';
    summary =
      'Caution Advised. At least one suspicious indicator is present. Pause and verify the sender independently before taking action.';
  }

  const recommendedActions = Array.from(
    new Set([
      ...triggeredFlags.map((flag) => flag.nextStep),
      ...(detectedTextPatterns.length > 0
        ? ['Do not reply to or click links inside the pasted message; verify via official USSD or helpline.']
        : []),
      'If you suspect fraud, submit an anonymous warning below to help protect other Ghanaians.',
    ])
  );

  return {
    score,
    riskLevel,
    summary,
    triggeredFlags,
    detectedTextPatterns,
    recommendedActions,
  };
}
