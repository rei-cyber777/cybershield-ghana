/**
 * CyberShield Ghana — Core Features Data (`src/lib/featuresData.ts`)
 *
 * Edit the text in `CORE_FEATURES` below to update any card's title,
 * 14-year-old-friendly one-line summary, expanded explanation, bullet points,
 * or target section link.
 */

export type FeatureGroupId = 'scam_protection' | 'privacy_security';

export type FeatureIconName =
  | 'ScanSearch'
  | 'ShieldAlert'
  | 'FileWarning'
  | 'Share2'
  | 'UserX'
  | 'Lock'
  | 'Database'
  | 'ShieldCheck';

export type ImplementationStatus = 'Live' | 'Configured in SQL / Production';

export interface FeatureGroupMeta {
  id: FeatureGroupId;
  label: string;
  shortDescription: string;
}

export interface CoreFeatureItem {
  id: string;
  number: string;
  groupId: FeatureGroupId;
  iconName: FeatureIconName;
  accentColor: 'cyan' | 'violet' | 'magenta' | 'gold';
  status: ImplementationStatus;
  title: string;
  oneLineSummary: string;
  whatItIs: string;
  howItProtectsYou: string[];
  ctaLabel: string;
  ctaHref: string;
  hasMiniDemo?: boolean;
}

export interface MiniDemoChip {
  id: string;
  label: string;
  weight: number;
}

export interface SecurityPillarSummary {
  id: 'threat-detection' | 'encryption' | 'access-control';
  badge: string;
  title: string;
  plainEnglishIntro: string;
  bulletPoints: string[];
  accentColor: 'cyan' | 'violet' | 'gold';
  iconName: FeatureIconName;
}

export const SECURITY_PILLARS_OVERVIEW: SecurityPillarSummary[] = [
  {
    id: 'threat-detection',
    badge: 'PILLAR 01 · THREAT DETECTION',
    title: 'Heuristic Scam & Red-Flag Detection',
    plainEnglishIntro:
      'Think of this as a smart checklist that reads suspicious messages and spots common scammer tricks before you lose money.',
    bulletPoints: [
      'Scans messages locally in your browser for 13 red-flag patterns like "send your MoMo PIN", "processing fee", or fake shortlinks.',
      'Highlights psychological pressure tactics—such as fake countdowns or impersonating telecom staff—in plain English.',
      'Scores risk from Low to Critical and gives you immediate step-by-step advice on how to verify the sender safely.',
    ],
    accentColor: 'cyan',
    iconName: 'ScanSearch',
  },
  {
    id: 'encryption',
    badge: 'PILLAR 02 · ENCRYPTION IN TRANSIT',
    title: 'Safe Connections (HTTPS / TLS)',
    plainEnglishIntro:
      'Encryption scrambles the connection between your phone or laptop and CyberShield so nobody on public Wi-Fi can spy on what you read or submit.',
    bulletPoints: [
      'All pages and form submissions travel over encrypted HTTPS connections provided by our web hosting and database endpoints.',
      'Automatically scrubs 10-digit Ghana phone numbers into [REDACTED-PHONE] before a scam report is ever stored.',
      'Opens external community links (such as Opportunity Bridge WhatsApp) with strict browser isolation (rel="noopener noreferrer").',
    ],
    accentColor: 'violet',
    iconName: 'Lock',
  },
  {
    id: 'access-control',
    badge: 'PILLAR 03 · ACCESS CONTROL',
    title: 'Locked-Down Database & Zero-PII Rules',
    plainEnglishIntro:
      'Access control is like a one-way dropbox: anyone can submit a scam warning, but regular visitors can never open the box to read other people’s private data.',
    bulletPoints: [
      'Uses PostgreSQL Row Level Security (RLS) so public visitors have INSERT-only permission and cannot list subscriber emails.',
      'Holds new scam reports in a moderated review queue until an administrator verifies and publishes them.',
      'Collects zero personal identity fields (no names, phone numbers, or national IDs) on the anonymous reporting form.',
    ],
    accentColor: 'gold',
    iconName: 'Database',
  },
];

export const FEATURE_GROUPS: FeatureGroupMeta[] = [
  {
    id: 'scam_protection',
    label: 'Protecting You From Scams',
    shortDescription:
      'Interactive tools that help you test suspicious messages, spot manipulation, and warn your friends.',
  },
  {
    id: 'privacy_security',
    label: 'Protecting Your Privacy and the Site',
    shortDescription:
      'Built-in safeguards so you can report fraud and learn safely without giving away your personal details.',
  },
];

export const MINI_DEMO_CHIPS: MiniDemoChip[] = [
  {
    id: 'chip-money-first',
    label: 'Asks for money first',
    weight: 35,
  },
  {
    id: 'chip-too-good',
    label: 'Too-good-to-be-true profit',
    weight: 35,
  },
  {
    id: 'chip-pressure',
    label: 'Pressure to act fast',
    weight: 30,
  },
];

/**
 * Pure helper for the illustrative mini-demo inside Card 1 (Scam Checker).
 */
export function calculateMiniDemoRisk(selectedChipIds: string[]): {
  score: number;
  level: 'Low' | 'Moderate' | 'High';
} {
  const unique = new Set(selectedChipIds);
  const score = MINI_DEMO_CHIPS.reduce(
    (sum, chip) => sum + (unique.has(chip.id) ? chip.weight : 0),
    0
  );

  if (score >= 65) {
    return { score, level: 'High' };
  }
  if (score >= 30) {
    return { score, level: 'Moderate' };
  }
  return { score, level: 'Low' };
}

/**
 * Pure helper for tracking how many of the 8 feature cards the user has opened.
 */
export function computeExplorationProgress(
  exploredIds: string[],
  totalFeatures = CORE_FEATURES.length
): {
  exploredCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
} {
  const validIds = new Set(CORE_FEATURES.map((f) => f.id));
  const uniqueValid = Array.from(new Set(exploredIds)).filter((id) => validIds.has(id));
  const exploredCount = uniqueValid.length;
  const percentage =
    totalFeatures > 0 ? Math.round((exploredCount / totalFeatures) * 100) : 0;

  return {
    exploredCount,
    totalCount: totalFeatures,
    percentage,
    isComplete: exploredCount >= totalFeatures && totalFeatures > 0,
  };
}

export const CORE_FEATURES: CoreFeatureItem[] = [
  // ==========================================================================
  // GROUP 1: Protecting You From Scams
  // ==========================================================================
  {
    id: 'feat-scam-checker',
    number: '01',
    groupId: 'scam_protection',
    iconName: 'ScanSearch',
    accentColor: 'cyan',
    status: 'Live',
    title: 'Scam Checker',
    oneLineSummary:
      'Answer a few quick questions about a strange call or message to see how risky it is.',
    whatItIs:
      'An interactive checklist and keyword scanner that scores suspicious messages from Low to Critical risk using clear, rule-based warning signs.',
    howItProtectsYou: [
      'Flags high-danger requests—like anyone asking for your 4-digit MoMo PIN or 6-digit OTP code—right away.',
      'Checks pasted messages for common manipulation phrases like "double your cash" or "pay a processing fee".',
      'Gives you plain-English next steps so you know how to verify the sender safely before acting.',
    ],
    ctaLabel: 'Try the Scam Checker',
    ctaHref: '#scam-checker',
    hasMiniDemo: true,
  },
  {
    id: 'feat-red-flag-detection',
    number: '02',
    groupId: 'scam_protection',
    iconName: 'ShieldAlert',
    accentColor: 'magenta',
    status: 'Live',
    title: 'Red-Flag Detection',
    oneLineSummary:
      'Learn the exact tricks scammers use in fake investments, fake scholarships, MoMo fraud, and phishing.',
    whatItIs:
      'A visual guide and interactive WhatsApp message lab that breaks down the four biggest online scams in Ghana.',
    howItProtectsYou: [
      'Shows you side-by-side how each scam works, what red flags to look for, and what to do instead.',
      'Lets you practice tapping suspicious parts of realistic fake WhatsApp and SMS messages in a safe sandbox.',
      'Includes real anonymized scam messages with every manipulation trick highlighted and explained.',
    ],
    ctaLabel: 'Explore Threat Guides',
    ctaHref: '#threats',
  },
  {
    id: 'feat-easy-reporting',
    number: '03',
    groupId: 'scam_protection',
    iconName: 'FileWarning',
    accentColor: 'violet',
    status: 'Live',
    title: 'Easy Reporting',
    oneLineSummary:
      'Report new scams anonymously in seconds and find the right Ghana authority to contact.',
    whatItIs:
      'A simple zero-personal-data report form paired with a searchable directory of Ghana’s cybercrime reporting channels.',
    howItProtectsYou: [
      'Lets you filter reporting channels by scam type so you know which institution handles your case.',
      'Allows you to submit warnings about new WhatsApp, SMS, or call scams without typing your name or phone number.',
      'Uses clearly marked contact placeholders until official shortcodes and helpline numbers are verified by the project maintainer.',
    ],
    ctaLabel: 'Open Report & Directory',
    ctaHref: '#directory',
  },
  {
    id: 'feat-verified-alerts',
    number: '04',
    groupId: 'scam_protection',
    iconName: 'Share2',
    accentColor: 'gold',
    status: 'Live',
    title: 'Verified Scam Alerts',
    oneLineSummary:
      'Read admin-reviewed scam warnings and share them with family and friends on WhatsApp in one tap.',
    whatItIs:
      'A moderated community alert board where reviewed scam reports are published with clear prevention tips and a one-click WhatsApp share button.',
    howItProtectsYou: [
      'Holds raw submissions in a protected review queue first so unverified rumors or spam do not clutter the feed.',
      'Summarizes the exact channel, scam category, and a practical safety tip on every published alert.',
      'Formats each alert into a ready-to-send WhatsApp message so you can warn campus or family groups fast.',
    ],
    ctaLabel: 'View Verified Alerts',
    ctaHref: '#report-scam',
  },

  // ==========================================================================
  // GROUP 2: Protecting Your Privacy and the Site
  // ==========================================================================
  {
    id: 'feat-minimal-data',
    number: '05',
    groupId: 'privacy_security',
    iconName: 'UserX',
    accentColor: 'cyan',
    status: 'Live',
    title: 'Minimal Data',
    oneLineSummary:
      'You can use the tools and report scams without ever giving us your name, phone number, or MoMo details.',
    whatItIs:
      'A strict privacy-by-design rule across the site: we only ask for the scam type, channel, and what happened—plus an automatic filter that scrubs phone numbers.',
    howItProtectsYou: [
      'The scam report form has no fields for your name, phone number, email, or national ID.',
      'If someone accidentally types a 10-digit Ghana phone number inside a report description, our code replaces it with [REDACTED-PHONE] before saving.',
      'For the optional newsletter, we only store your email and chosen topic interest, and explain clearly how to unsubscribe.',
    ],
    ctaLabel: 'Inspect Anonymous Form',
    ctaHref: '#report-scam',
  },
  {
    id: 'feat-safe-connections',
    number: '06',
    groupId: 'privacy_security',
    iconName: 'Lock',
    accentColor: 'violet',
    status: 'Live',
    title: 'Safe Connections (HTTPS)',
    oneLineSummary:
      'Everything you read or submit on CyberShield travels over a standard encrypted HTTPS web connection.',
    whatItIs:
      'Standard TLS/HTTPS transport encryption provided by our hosting platform and database API endpoints.',
    howItProtectsYou: [
      'Prevents people on the same public Wi-Fi network from snooping on the pages you are reading or the forms you submit.',
      'Ensures your browser verifies it is talking to the real CyberShield Ghana domain.',
      'External links (like the Opportunity Bridge WhatsApp community) open safely in a new tab with rel="noopener noreferrer".',
    ],
    ctaLabel: 'Visit Opportunity Bridge',
    ctaHref: '#opportunity-bridge',
  },
  {
    id: 'feat-locked-down-db',
    number: '07',
    groupId: 'privacy_security',
    iconName: 'Database',
    accentColor: 'gold',
    status: 'Configured in SQL / Production',
    title: 'Locked-Down Database',
    oneLineSummary:
      'Database security rules allow public visitors to submit reports or sign up, but never read other people’s emails.',
    whatItIs:
      'PostgreSQL Row Level Security (RLS) policies in our Supabase migration script that lock down table read access.',
    howItProtectsYou: [
      'Anonymous visitors are granted INSERT-only access on the subscribers and scam_reports tables—public SELECT queries are blocked.',
      'Subscriber emails can never be listed or scraped from the browser using the public anon key.',
      'Double opt-in confirmation and one-click unsubscribe run through dedicated database functions using random hex tokens.',
    ],
    ctaLabel: 'View Supabase RLS SQL',
    ctaHref: '#cyber-news',
  },
  {
    id: 'feat-spam-protection',
    number: '08',
    groupId: 'privacy_security',
    iconName: 'ShieldCheck',
    accentColor: 'magenta',
    status: 'Live',
    title: 'Spam and Abuse Protection',
    oneLineSummary:
      'Hidden bot traps and cooldown timers stop automated spam from flooding our forms.',
    whatItIs:
      'Lightweight form guards combining invisible honeypot fields, input length validation, and submission cooldown checks.',
    howItProtectsYou: [
      'Invisible honeypot inputs catch automated bots that blindly fill every field on a web page.',
      'Rate-limit cooldown checks prevent rapid repeat form submissions from overwhelming the report queue or newsletter.',
      'Strict character limits and email format checks block malformed payloads both in the browser and in PostgreSQL CHECK constraints.',
    ],
    ctaLabel: 'Test Newsletter Signup',
    ctaHref: '#cyber-news',
  },
];
