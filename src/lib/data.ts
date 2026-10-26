export interface ProtectionStep {
  number: string;
  title: string;
  titleTwi: string;
  subtitle: string;
  description: string;
  actionAnchor: string;
  actionLabel: string;
}

export interface ThreatCategory {
  id: 'mobile_money' | 'investment' | 'fake_jobs_scholarships' | 'phishing';
  title: string;
  titleTwi: string;
  tagline: string;
  riskTag: string;
  howItWorks: string[];
  redFlags: string[];
  whatToDo: string[];
}

export interface SpotScamSegment {
  id: string;
  text: string;
  isSuspicious: boolean;
  flagTitle?: string;
  explanation?: string;
}

export interface SpotScamScenario {
  id: string;
  title: string;
  senderName: string;
  senderNumber: string;
  channel: 'WhatsApp' | 'SMS';
  timestamp: string;
  segments: SpotScamSegment[];
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface RealScamExample {
  id: string;
  title: string;
  category: string;
  channel: string;
  rawMessage: string;
  annotations: {
    highlight: string;
    label: string;
    detail: string;
  }[];
  takeaway: string;
}

export interface AuthorityChannel {
  id: string;
  organization: string;
  role: string;
  scamTypes: string[];
  contactPlaceholder: string;
  verificationNote: string;
  whenToContact: string;
  officialUrl: string;
}

export interface ScamReportItem {
  id: string;
  scamType: string;
  channel: 'WhatsApp' | 'SMS' | 'Phone Call' | 'Social Media';
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'dismissed';
  createdAt: string;
}

export interface VerifiedAlertItem {
  id: string;
  title: string;
  scamType: string;
  channel: string;
  summary: string;
  preventionTip: string;
  severity: 'Moderate' | 'High' | 'Critical';
  publishedAt: string;
  published?: boolean;
  isIllustrative?: boolean;
}

export interface CyberNewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  category:
    | 'Ghana Alerts'
    | 'Global Cybersecurity'
    | 'Global Tech & AI'
    | 'Student Safety Tips';
  url: string;
  isIllustrative?: boolean;
}

export interface NewsletterTopicTrack {
  id: string;
  label: string;
  badge: string;
  description: string;
}

export const PROTECTION_STEPS: ProtectionStep[] = [
  {
    number: '01',
    title: 'Spot the Manipulation',
    titleTwi: '01. Hu Nsisi Nsenkyerenne No',
    subtitle: 'Recognize artificial urgency, fake SMS deposit alerts, and impersonation.',
    description:
      'Scammers rely on panic and excitement—like claiming your SIM card will be blocked in 10 minutes or offering a guaranteed scholarship slot for a quick Mobile Money fee.',
    actionAnchor: '#spot-the-scam',
    actionLabel: 'Practice in Message Lab',
  },
  {
    number: '02',
    title: 'Verify Before Acting',
    titleTwi: '02. Hwehwe Mu Ansa Na Waye Biribi',
    subtitle: 'Run suspicious messages through our rule-based Red-Flag Scanner.',
    description:
      'Never dial a phone number inside a suspicious SMS or click shortened links. Use our deterministic red-flag checker to score the risk and see safe verification steps.',
    actionAnchor: '#scam-checker',
    actionLabel: 'Open Scam Checker',
  },
  {
    number: '03',
    title: 'Report Anonymously',
    titleTwi: '03. Bo Amannee A Wommo Wo Din',
    subtitle: 'Warn the community without sharing any personal data.',
    description:
      'Submit the scam category, channel, and how the fraudster approached you. No personal data is collected, and community scam alerts can be shared straight to family WhatsApp groups.',
    actionAnchor: '#report-scam',
    actionLabel: 'Submit Anonymous Report',
  },
  {
    number: '04',
    title: 'Stay Informed & Connected',
    titleTwi: '04. Nya Nokware Kyererkyere Ne Hokwan Pa',
    subtitle: 'Join Opportunity Bridge and receive educational cyber safety briefings.',
    description:
      'Access student opportunities through Opportunity Bridge while learning how to spot emerging online scam patterns across Ghana.',
    actionAnchor: '#opportunity-bridge',
    actionLabel: 'Explore Opportunity Bridge',
  },
];

export const THREAT_CATEGORIES: ThreatCategory[] = [
  {
    id: 'mobile_money',
    title: 'Mobile Money (MoMo) Fraud',
    titleTwi: 'Mobile Money (MoMo) Nsisi',
    tagline: 'Fake deposit alerts, wrong-transfer reversal pressure, and cash-out approval traps.',
    riskTag: 'Common Scam Pattern',
    howItWorks: [
      'The scammer sends a fake SMS from a regular 10-digit phone number formatted to look like a MoMo credit alert.',
      'Seconds later, they call you sounding panicked—claiming they sent money by mistake to your number and begging you to send it to another number.',
      'Alternatively, they pose as telecom staff and trigger a cash-out prompt on your phone, telling you to enter your 4-digit PIN to "cancel" a deduction or "claim a bonus".',
    ],
    redFlags: [
      'The SMS alert came from a normal +233 phone number instead of the official telecom shortcode.',
      'Caller pressures you to rush before you check your actual wallet balance via official USSD.',
      'An unexpected USSD pop-up asks for your 4-digit MoMo PIN while you are on a phone call.',
    ],
    whatToDo: [
      'Never enter your MoMo PIN to receive money or cancel a transaction.',
      'Dial your network’s official USSD code yourself to verify if your actual wallet balance changed.',
      'Tell anyone claiming a wrong transfer to contact their telecom provider directly for an official reversal.',
    ],
  },
  {
    id: 'fake_jobs_scholarships',
    title: 'Fake Jobs & Scholarships',
    titleTwi: 'Adwuma Ne Scholarship Atorofoo',
    tagline: 'Advance-fee "protocol slots", fake embassy visa forms, and bogus interview medical fees.',
    riskTag: 'Student Scam Pattern',
    howItWorks: [
      'Fraudsters circulate flyers on WhatsApp and social media advertising "fully funded scholarships", "protocol recruitment slots", or remote student jobs.',
      'Applicants receive an instant "Congratulations" message without any real academic review or interview.',
      'To secure the offer, victims are asked to pay a "processing fee", "medical examination fee", or "document attestation fee" to a personal Mobile Money account.',
    ],
    redFlags: [
      'Payment is requested via a personal Mobile Money wallet or unofficial agent number.',
      'Guaranteed admission or job placement with "no interview required" or "urgent deadline in 2 hours".',
      'Emails come from free webmail addresses (e.g., @gmail.com) instead of an official university or .gov.gh domain.',
    ],
    whatToDo: [
      'Never pay money to secure a job interview, recruitment slot, or scholarship application.',
      'Verify opportunities directly on the official university, scholarship secretariat, or embassy website.',
      'Use trusted student communities like Opportunity Bridge that share educational opportunities and promote digital safety.',
    ],
  },
  {
    id: 'investment',
    title: 'Investment & Crypto Doublers',
    titleTwi: 'Sika Mfasoo Ntemntem Nsisi',
    tagline: 'WhatsApp/Telegram "cash flipping" groups, unlicensed forex bots, and Ponzi tiers.',
    riskTag: 'Financial Scam Pattern',
    howItWorks: [
      'You are added to a WhatsApp or Telegram group where "investors" post screenshots of GHS 500 turning into GHS 5,000 within hours.',
      'Most accounts in the group are controlled by the same scam ring staging fake testimonials to create fear of missing out (FOMO).',
      'When you deposit money, they show a fake dashboard balance and demand a "withdrawal tax" or "unlock fee" before you can cash out—then block you.',
    ],
    redFlags: [
      'Promises of guaranteed 30%–200% returns in days with "zero risk".',
      'Unsolicited group invitations where only admins can post or members spam payout screenshots.',
      'Demands for an extra "clearance fee" or "tax" before releasing your own funds.',
    ],
    whatToDo: [
      'Always check whether an investment firm is officially licensed by national financial regulators before sending money.',
      'Never pay a "withdrawal fee" to unlock funds—it is a secondary trap to extract more money.',
      'Adjust your WhatsApp Privacy > Groups setting to "My Contacts" so strangers cannot add you to scam groups.',
    ],
  },
  {
    id: 'phishing',
    title: 'Phishing & Account Takeover',
    titleTwi: 'Phishing Ne Akontaabu Wia',
    tagline: 'Lookalike banking pages, Ghana Card re-registration links, and WhatsApp 6-digit code theft.',
    riskTag: 'Account Takeover Pattern',
    howItWorks: [
      'An SMS, email, or WhatsApp message claims your bank account, SIM card, or student portal will be deactivated unless you verify your details immediately.',
      'The link opens a clone website that looks identical to a real bank or portal and steals your password, PIN, or Ghana Card number.',
      'For WhatsApp takeovers, a hijacked friend’s account messages you: "I accidentally sent my 6-digit SMS code to your number, please forward it to me."',
    ],
    redFlags: [
      'Mismatched or shortened URLs (e.g., bit.ly, or a strange domain ending in .xyz / .top instead of .com.gh or .gov.gh).',
      'Anyone—even a friend’s number—asking you to forward a 6-digit SMS registration code.',
      'Generic greetings ("Dear Valued Customer") combined with threats of immediate account closure.',
    ],
    whatToDo: [
      'Turn on Two-Step Verification in WhatsApp (Settings > Account > Two-step verification) right now.',
      'Never click login links inside unexpected SMS messages; type the official website address yourself.',
      'If a friend asks for a code or urgent loan on WhatsApp, call them on a regular voice call to confirm their voice.',
    ],
  },
];

export const SPOT_SCAM_SCENARIOS: SpotScamScenario[] = [
  {
    id: 'whatsapp-scholarship',
    title: 'Illustrative Scenario 1: The "Urgent International Scholarship" WhatsApp Message',
    senderName: 'Global Youth Scholarship Desk (Illustrative Example)',
    senderNumber: '+233 55 [REDACTED] (Illustrative Personal Number)',
    channel: 'WhatsApp',
    timestamp: 'Illustrative scenario',
    segments: [
      {
        id: 'seg-1',
        text: 'CONGRATULATIONS! Your phone number was selected for the 2026 Fully Funded Canada & UK Student Grant.',
        isSuspicious: true,
        flagTitle: 'Unsolicited Selection Without Application',
        explanation:
          'You cannot win a legitimate international scholarship randomly by phone number without submitting an academic application.',
      },
      {
        id: 'seg-2',
        text: 'Classes begin next month in Toronto and London.',
        isSuspicious: false,
      },
      {
        id: 'seg-3',
        text: 'To lock your visa and flight slot before 5:00 PM today, send GHS 450 processing fee via MoMo to Agent Kwame (055-XXX-XXXX).',
        isSuspicious: true,
        flagTitle: 'Advance Fee to Personal Mobile Money Wallet',
        explanation:
          'Real scholarship boards and embassies never ask students to send processing fees to a personal Mobile Money agent number.',
      },
      {
        id: 'seg-4',
        text: 'Fill your Ghana Card & MoMo PIN confirmation at: http://gh-student-grant-claim.top/verify',
        isSuspicious: true,
        flagTitle: 'Phishing Link Asking for MoMo PIN',
        explanation:
          'The domain (.top) is a suspicious lookalike site, and no form should ever ask for your Mobile Money PIN.',
      },
    ],
  },
  {
    id: 'sms-momo-reversal',
    title: 'Illustrative Scenario 2: The "Wrong Transfer" Fake Deposit SMS',
    senderName: '+233 24 [REDACTED] (Illustrative Example)',
    senderNumber: 'Sent from regular 10-digit mobile number (NOT official shortcode)',
    channel: 'SMS',
    timestamp: 'Illustrative scenario',
    segments: [
      {
        id: 'sms-1',
        text: 'Sender ID: +233 24 XXX XXXX (Personal Number)',
        isSuspicious: true,
        flagTitle: 'Spoofed Sender Number',
        explanation:
          'Official Mobile Money transaction alerts come from network shortcodes, never from a standard 10-digit personal number.',
      },
      {
        id: 'sms-2',
        text: ' Cash-In received: GHS 1,200.00 from KOFI MENSAH. Current Balance: GHS 1,840.00.',
        isSuspicious: true,
        flagTitle: 'Fabricated Balance Text',
        explanation:
          'Anyone can type "Cash-In received" in an SMS. Always check your real balance by dialing the official USSD code yourself.',
      },
      {
        id: 'sms-3',
        text: ' Please my sister is in the hospital, I sent the GHS 1,200 to your number by mistake! Send GHS 1,100 back to 059-XXX-XXXX now and keep GHS 100!',
        isSuspicious: true,
        flagTitle: 'Emotional Urgency + Different Return Number',
        explanation:
          'Scammers offer you a "reward" to rush you into sending your own money before you check your true wallet balance.',
      },
    ],
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario:
      'Illustrative scenario: You receive an SMS from a normal 10-digit phone number saying you received GHS 850. Immediately, someone calls begging you to send the money back to another number because of a family emergency. What is your safest move?',
    options: [
      {
        id: 'q1-a',
        text: 'Send GHS 800 back quickly to help them out.',
        isCorrect: false,
        feedback:
          'Dangerous! That SMS was typed by the caller from a personal phone—no money entered your wallet, so you would be sending your own savings.',
      },
      {
        id: 'q1-b',
        text: 'Hang up, dial the official MoMo USSD code yourself to check your real balance, and tell them to use the official telecom reversal channel.',
        isCorrect: true,
        feedback:
          'Spot on! Checking your balance via official USSD and insisting on official telecom reversal stops wrong-transfer scams.',
      },
      {
        id: 'q1-c',
        text: 'Give the caller your MoMo PIN so they can reverse it themselves.',
        isCorrect: false,
        feedback:
          'Never share your MoMo PIN with anyone—giving your PIN gives scammers total control over your wallet.',
      },
    ],
  },
  {
    id: 'q2',
    scenario:
      'Illustrative scenario: A WhatsApp flyer offers a "Guaranteed Fully Funded Scholarship + Monthly Stipend", but asks applicants to pay a GHS 300 "application verification fee" to a personal MoMo number before midnight. How should you respond?',
    options: [
      {
        id: 'q2-a',
        text: 'Pay quickly before the midnight deadline runs out.',
        isCorrect: false,
        feedback:
          'Artificial midnight deadlines are designed to make you pay before verifying. Genuine scholarships do not charge verification fees via personal MoMo.',
      },
      {
        id: 'q2-b',
        text: 'Refuse to pay, verify on the university’s official website or a trusted community like Opportunity Bridge, and report the scam flyer.',
        isCorrect: true,
        feedback:
          'Correct! Real scholarships are verified on official institutional domains and communities like Opportunity Bridge—never through personal MoMo fees.',
      },
      {
        id: 'q2-c',
        text: 'Send half the money first to test if it is real.',
        isCorrect: false,
        feedback:
          'Scammers happily take partial payments and disappear or demand even more fees afterward.',
      },
    ],
  },
  {
    id: 'q3',
    scenario:
      'Illustrative scenario: Your classmate sends you a WhatsApp message saying: "Hey, I accidentally sent my 6-digit SMS verification code to your phone number, please forward it to me urgently." What is actually happening?',
    options: [
      {
        id: 'q3-a',
        text: 'Your classmate’s account was likely hijacked, and the attacker is trying to take over YOUR WhatsApp account using your 6-digit registration code.',
        isCorrect: true,
        feedback:
          'Exactly right! That 6-digit code is YOUR WhatsApp login code. Never forward it, and enable Two-Step Verification in WhatsApp settings.',
      },
      {
        id: 'q3-b',
        text: 'It is a harmless phone glitch—forward the 6-digit code right away.',
        isCorrect: false,
        feedback:
          'Forwarding that 6-digit code lets the attacker immediately hijack your WhatsApp account and message your contacts for money.',
      },
      {
        id: 'q3-c',
        text: 'Reply with your password as well so they can log in faster.',
        isCorrect: false,
        feedback:
          'Never share verification codes or passwords over chat, even with numbers you recognize.',
      },
    ],
  },
  {
    id: 'q4',
    scenario:
      'Illustrative scenario: While on a call with someone claiming to be telecom customer care, a pop-up appears on your phone screen asking you to enter your 4-digit MoMo PIN to "stop an unauthorized deduction". What does that pop-up really do?',
    options: [
      {
        id: 'q4-a',
        text: 'It blocks scammers from accessing your account.',
        isCorrect: false,
        feedback:
          'False! Entering your MoMo PIN on an unexpected prompt authorizes a cash-out or payment OUT of your wallet.',
      },
      {
        id: 'q4-b',
        text: 'It authorizes a cash-out or transfer FROM your wallet to the scammer. Cancel the prompt and end the call immediately.',
        isCorrect: true,
        feedback:
          'Correct! Your MoMo PIN only authorizes money leaving your wallet. Never enter your PIN to "cancel" a transaction or "receive" a bonus.',
      },
      {
        id: 'q4-c',
        text: 'It updates your SIM card registration.',
        isCorrect: false,
        feedback:
          'SIM registration never happens through a Mobile Money PIN cash-out prompt.',
      },
    ],
  },
];

export const REAL_SCAM_EXAMPLES: RealScamExample[] = [
  {
    id: 'ex-momo-cashout',
    title: 'Example (Illustrative Scenario): The "Promo Bonus Approval" Cash-Out Trap',
    category: 'Mobile Money Fraud',
    channel: 'Phone Call + USSD Prompt (Illustrative)',
    rawMessage:
      'Caller (+233 54 [REDACTED]): "Hello cherished customer, I am calling from the Head Office Promotions Desk. You have won GHS 2,500 in our anniversary draw. We have pushed a claim menu to your screen—just enter your 4-digit PIN now so the GHS 2,500 reflects in your wallet."',
    annotations: [
      {
        highlight: '+233 54 [REDACTED]',
        label: 'Personal Prepaid Number',
        detail: 'Official telecom staff do not call from random personal mobile numbers to award prizes.',
      },
      {
        highlight: 'pushed a claim menu to your screen',
        label: 'Hidden Cash-Out Request',
        detail: 'The scammer initiated a Cash-Out or Merchant Payment on your number from their device.',
      },
      {
        highlight: 'enter your 4-digit PIN now so the GHS 2,500 reflects',
        label: 'PIN Deception',
        detail: 'You NEVER need to enter your MoMo PIN to receive money. Entering your PIN approves money leaving your account.',
      },
    ],
    takeaway: 'Rule of thumb: Receiving money requires ZERO action. If a prompt asks for your PIN, money is leaving your wallet.',
  },
  {
    id: 'ex-protocol-job',
    title: 'Example (Illustrative Scenario): The "Protocol Recruitment Medical Fee" Scam',
    category: 'Fake Jobs & Scholarships',
    channel: 'WhatsApp / Social Media (Illustrative)',
    rawMessage:
      'Dear Applicant, your name has been added to the Special Protocol List for the 2026 Graduate Intake. Do not disclose this to anyone. Send GHS 650 for your Medical & Background Clearance Folder to Officer Mensah on MoMo [059-REDACTED] before 4:00 PM today or your slot will be reassigned.',
    annotations: [
      {
        highlight: 'Special Protocol List ... Do not disclose this to anyone',
        label: 'Secrecy Trap',
        detail: 'Scammers tell you to keep it secret so family members or friends do not warn you that it is fake.',
      },
      {
        highlight: 'Send GHS 650 ... on MoMo [059-REDACTED]',
        label: 'Personal Wallet Fee',
        detail: 'Public institutions and reputable employers never collect medical or clearance fees via personal Mobile Money.',
      },
      {
        highlight: 'before 4:00 PM today or your slot will be reassigned',
        label: 'Manufactured Scarcity',
        detail: 'High-pressure deadlines prevent you from verifying with the official recruitment portal.',
      },
    ],
    takeaway: 'Any "protocol slot" or scholarship that demands secrecy and a personal MoMo payment is fraudulent.',
  },
  {
    id: 'ex-telegram-invest',
    title: 'Example (Illustrative Scenario): The "GHS 300 to GHS 3,500 in 6 Hours" Flipping Group',
    category: 'Investment Scams',
    channel: 'Telegram / WhatsApp Group (Illustrative)',
    rawMessage:
      'ADMIN: "Batch B payout completed! Congrats to Ama in Kumasi who invested GHS 300 at 8 AM and just received GHS 3,500! Only 4 VIP slots left today. DM Admin on [wa.me/REDACTED] to lock your package!"',
    annotations: [
      {
        highlight: 'invested GHS 300 at 8 AM and just received GHS 3,500',
        label: 'Impossible Return Rate',
        detail: 'A 1,000%+ return in 6 hours is financially impossible. All payout screenshots in the group are staged.',
      },
      {
        highlight: 'Only 4 VIP slots left today',
        label: 'False Scarcity Trigger',
        detail: 'Designed to rush students and workers into sending money before researching the scheme.',
      },
    ],
    takeaway: 'Always check whether an investment firm is officially licensed by national financial regulators before investing.',
  },
];

export const GHANA_AUTHORITIES_DIRECTORY: AuthorityChannel[] = [
  {
    id: 'auth-csa',
    organization: 'Cyber Security Authority (CSA) Ghana',
    role: 'National agency responsible for cybersecurity incident response, online fraud reporting, and public advisories.',
    scamTypes: ['Phishing', 'Investment Scams', 'Online Blackmail', 'Fake Jobs & Scholarships', 'Impersonation'],
    contactPlaceholder: 'Verify current contacts on official website: csa.gov.gh',
    verificationNote: 'Always confirm current reporting contacts directly on csa.gov.gh.',
    whenToContact: 'Report phishing domains, online investment fraud, impersonation accounts, and cyber extortion.',
    officialUrl: 'https://www.csa.gov.gh/',
  },
  {
    id: 'auth-gps-cid',
    organization: 'Ghana Police Service',
    role: 'Law enforcement investigation of criminal fraud, identity theft, and financial extortion.',
    scamTypes: ['Mobile Money Fraud', 'Investment Scams', 'Fake Jobs & Scholarships', 'Identity Theft'],
    contactPlaceholder: 'Verify current contacts on official website: police.gov.gh',
    verificationNote: 'Confirm current Cybercrime Unit contacts from official police.gov.gh.',
    whenToContact: 'When financial loss has occurred, threats are made, or you need a formal police report for bank/telecom investigation.',
    officialUrl: 'https://police.gov.gh/',
  },
  {
    id: 'auth-bog',
    organization: 'Bank of Ghana (BoG)',
    role: 'Central bank overseeing licensed banks, payment service providers, and financial institutions.',
    scamTypes: ['Mobile Money Fraud', 'Unlicensed Loan Apps', 'Banking Phishing'],
    contactPlaceholder: 'Verify licensed institutions on official website: bog.gov.gh',
    verificationNote: 'Confirm official licensed payment providers and complaint channels on bog.gov.gh.',
    whenToContact: 'To verify licensed banks/payment providers or report unlicensed loan apps and banking fraud.',
    officialUrl: 'https://www.bog.gov.gh/',
  },
  {
    id: 'auth-sec',
    organization: 'Securities and Exchange Commission (SEC) Ghana',
    role: 'Financial regulator overseeing capital markets and licensed investment schemes.',
    scamTypes: ['Investment Scams', 'Fake Crypto / Forex Schemes'],
    contactPlaceholder: 'Verify licensed investment firms on official website: sec.gov.gh',
    verificationNote: 'Confirm whether an investment firm is licensed on sec.gov.gh.',
    whenToContact: 'Before investing in any scheme or to report unlicensed money-doubling and investment fraud.',
    officialUrl: 'https://sec.gov.gh/',
  },
];

export const INITIAL_VERIFIED_ALERTS: VerifiedAlertItem[] = [
  {
    id: 'alert-1',
    title: 'Example (Illustrative Scenario): Fake "Student Laptop & Scholarship Grant" Links on WhatsApp',
    scamType: 'Fake Jobs & Scholarships',
    channel: 'WhatsApp',
    summary:
      'Illustrative scenario: Links claiming to distribute free student laptops and instant bursaries ask students to pay a GHS 150 "delivery & processing fee" via personal MoMo.',
    preventionTip:
      'Never pay delivery or verification fees to personal Mobile Money numbers. Verify student opportunities on official portals or Opportunity Bridge.',
    severity: 'Moderate',
    publishedAt: 'Illustrative scenario',
    published: true,
    isIllustrative: true,
  },
  {
    id: 'alert-2',
    title: 'Example (Illustrative Scenario): Spoofed SMS Credit Alerts Followed by "Wrong Transfer" Calls',
    scamType: 'Mobile Money Fraud',
    channel: 'SMS',
    summary:
      'Illustrative scenario: Scammers send fake deposit messages from standard 10-digit numbers and call within seconds claiming the money was meant for hospital bills.',
    preventionTip:
      'Always check your actual wallet balance via your network’s official USSD code and ask the caller to request an official reversal through their telecom provider.',
    severity: 'Moderate',
    publishedAt: 'Illustrative scenario',
    published: true,
    isIllustrative: true,
  },
  {
    id: 'alert-3',
    title: 'Example (Illustrative Scenario): WhatsApp 6-Digit Verification Code Takeover in Study Groups',
    scamType: 'Phishing',
    channel: 'WhatsApp',
    summary:
      'Illustrative scenario: Compromised accounts message coursemates asking them to forward a 6-digit SMS code or lend urgent money.',
    preventionTip:
      'Enable Two-Step Verification in WhatsApp Settings > Account, and always call a friend by voice if they message asking for money or a code.',
    severity: 'Moderate',
    publishedAt: 'Illustrative scenario',
    published: true,
    isIllustrative: true,
  },
];

export const INITIAL_PENDING_REPORTS: ScamReportItem[] = [
  {
    id: 'rep-seed-101',
    scamType: 'Fake Jobs & Scholarships',
    channel: 'WhatsApp',
    description:
      '[Example — Illustrative scenario] Someone in a student group posted a link for a "Canada Work & Study Visa Waiver" asking for GHS 400 medical fee to a personal MoMo wallet.',
    status: 'pending',
    createdAt: 'Illustrative sample',
  },
  {
    id: 'rep-seed-102',
    scamType: 'Mobile Money Fraud',
    channel: 'Phone Call',
    description:
      '[Example — Illustrative scenario] Caller claimed my MoMo wallet had an "unclaimed loyalty bonus" and triggered a cash-out prompt asking me to enter my 4-digit PIN.',
    status: 'pending',
    createdAt: 'Illustrative sample',
  },
];

export const NEWSLETTER_TOPIC_TRACKS: NewsletterTopicTrack[] = [
  {
    id: 'Cybersecurity & Ghana Scam Alerts',
    label: 'Cybersecurity & Ghana Scam Alerts',
    badge: 'CYBER DEFENSE',
    description:
      'Mobile Money fraud warnings, local scam pattern breakdowns, and phishing defense tips.',
  },
  {
    id: 'Global Tech & AI News',
    label: 'Global Tech & AI News',
    badge: 'GLOBAL TECH',
    description:
      'Developments in AI, open-source software, cloud engineering, and global tech trends.',
  },
  {
    id: 'Global Cyber Threat Intel',
    label: 'Global Cyber Threat Intelligence',
    badge: 'THREAT INTEL',
    description:
      'Security briefings, browser & OS vulnerability patches, and passwordless authentication tips.',
  },
  {
    id: 'Student Tech & Scholarships',
    label: 'Student Tech & Scholarship Opportunities',
    badge: 'OPPORTUNITIES',
    description:
      'Student internships, hackathons, and safe international scholarship verification tips.',
  },
];

export const CURATED_CYBER_NEWS: CyberNewsItem[] = [
  {
    id: 'news-1',
    title:
      'Example Topic: Protecting Mobile Money Users from Social Engineering & Reversal Tricks',
    source: 'Illustrative scenario · CyberShield Educational Guide',
    date: 'Illustrative scenario',
    category: 'Ghana Alerts',
    url: '#threats',
    isIllustrative: true,
  },
  {
    id: 'news-2',
    title:
      'Example Topic: Using Multi-Factor Authentication & Two-Step Verification on WhatsApp',
    source: 'Illustrative scenario · CyberShield Educational Guide',
    date: 'Illustrative scenario',
    category: 'Global Cybersecurity',
    url: '#threats',
    isIllustrative: true,
  },
  {
    id: 'news-3',
    title:
      'How Students Can Verify International Scholarships Without Falling for Advance-Fee Scams',
    source: 'Opportunity Bridge Community',
    date: 'Community Guide',
    category: 'Student Safety Tips',
    url: 'https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5',
    isIllustrative: false,
  },
  {
    id: 'news-4',
    title:
      'Example Topic: Spotting Unlicensed Online Investment and "Cash-Flipping" Groups',
    source: 'Illustrative scenario · CyberShield Educational Guide',
    date: 'Illustrative scenario',
    category: 'Ghana Alerts',
    url: '#spot-the-scam',
    isIllustrative: true,
  },
  {
    id: 'news-5',
    title:
      'Example Topic: How Passkeys & Passwordless Logins Help Prevent Phishing',
    source: 'Illustrative scenario · CyberShield Educational Guide',
    date: 'Illustrative scenario',
    category: 'Global Tech & AI',
    url: '#scam-checker',
    isIllustrative: true,
  },
  {
    id: 'news-6',
    title:
      'Example Topic: Open-Source Security Habits & Dependency Safety for Student Developers',
    source: 'Illustrative scenario · CyberShield Educational Guide',
    date: 'Illustrative scenario',
    category: 'Global Tech & AI',
    url: '#scam-checker',
    isIllustrative: true,
  },
];
