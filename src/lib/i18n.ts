export type Language = 'en' | 'tw';

export interface TranslationDictionary {
  nav: {
    threats: string;
    scamLab: string;
    checker: string;
    opportunityBridge: string;
    cyberTechNews: string;
    directory: string;
    reportCta: string;
  };
  hero: {
    kicker: string;
    headlinePrefix: string;
    headlineHighlight: string;
    headlineSuffix: string;
    missionTerminal: string;
    ctaCheck: string;
    ctaReport: string;
    lowDataModeLabel: string;
    enable3DLabel: string;
    stepsTitle: string;
  };
  sections: {
    threatMapTitle: string;
    threatMapSubtitle: string;
    threatEduTitle: string;
    threatEduSubtitle: string;
    spotScamTitle: string;
    spotScamSubtitle: string;
    checkerTitle: string;
    checkerSubtitle: string;
    quizTitle: string;
    quizSubtitle: string;
    examplesTitle: string;
    examplesSubtitle: string;
    directoryTitle: string;
    directorySubtitle: string;
    reportTitle: string;
    reportSubtitle: string;
    adminTitle: string;
    newsTitle: string;
    creatorTitle: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    nav: {
      threats: 'Threats',
      scamLab: 'Spot the Scam',
      checker: 'Scam Checker',
      opportunityBridge: 'Opportunity Bridge',
      cyberTechNews: 'Cyber & Tech News',
      directory: 'Report & Directory',
      reportCta: 'Report a Scam',
    },
    hero: {
      kicker: 'Open-Source Cyber Defense · Built in Ghana',
      headlinePrefix: 'Defend Your Digital Life Against',
      headlineHighlight: 'Online Fraud',
      headlineSuffix: 'Across Ghana',
      missionTerminal:
        'Mission: Equip every Ghanaian student, worker, and family to spot Mobile Money scams, verify opportunities, and report cyber threats without sacrificing privacy.',
      ctaCheck: "Check if it's a scam",
      ctaReport: 'Report a scam',
      lowDataModeLabel: 'Static Shield (Data Saver)',
      enable3DLabel: 'Interactive 3D Shield',
      stepsTitle: 'How CyberShield Protects You in 4 Steps',
    },
    sections: {
      threatMapTitle: 'Simulated Threat Interception Network',
      threatMapSubtitle:
        'Illustrative visualization showing how common scam vectors across Ghana are identified and blocked before funds or credentials are lost.',
      threatEduTitle: 'Threat Intelligence & Scam Breakdown',
      threatEduSubtitle:
        'Understand the four most common digital fraud tactics targeting Ghanaians today: how scammers operate, warning signs, and exact defensive steps.',
      spotScamTitle: 'Spot the Scam: Interactive Message Inspector',
      spotScamSubtitle:
        'Tap the suspicious parts inside these realistic WhatsApp and SMS messages to uncover hidden red flags and test your detection instincts.',
      checkerTitle: 'Is This a Scam? Red-Flag Risk Scanner',
      checkerSubtitle:
        'Select the warning signs you see or paste a suspicious message below. Our modular rule engine calculates the risk level and tells you what to do next.',
      quizTitle: 'Cyber Readiness Quiz',
      quizSubtitle:
        'Test your ability to handle real-world Ghanaian cyber scenarios and share your readiness score card with friends on WhatsApp.',
      examplesTitle: 'Illustrative Scam Examples',
      examplesSubtitle:
        'Illustrative scam message templates with personal numbers redacted and every manipulation tactic annotated.',
      directoryTitle: 'Ghana Cybercrime Reporting & Authorities Directory',
      directorySubtitle:
        'Search official reporting channels by scam type and visit their official websites to confirm contact details.',
      reportTitle: 'Anonymous Scam Report & Community Scam Alerts',
      reportSubtitle:
        'Share new scam patterns anonymously to warn other Ghanaians. We never ask for your name, phone number, or Mobile Money details.',
      adminTitle: 'Admin Dashboard',
      newsTitle: 'Cybersecurity & Global Tech News Sign-Up Hub',
      creatorTitle: 'Built by Reindolf — Aspiring Cybersecurity Engineer',
    },
  },
  tw: {
    nav: {
      threats: 'Nsisi Kwan',
      scamLab: 'Hwehwe Nsisi No',
      checker: 'Scam Checker',
      opportunityBridge: 'Opportunity Bridge',
      cyberTechNews: 'Cyber Ne Tech News',
      directory: 'Bo Amannee',
      reportCta: 'Bo Scam Amannee',
    },
    hero: {
      kicker: 'Open-Source Ahobammo · Yehyehyee Wo Ghana',
      headlinePrefix: 'Bo Wo Ho Ban Wo',
      headlineHighlight: 'Intanet Nsisi',
      headlineSuffix: 'Ho Wo Ghana',
      missionTerminal:
        'Botaee: Se yebeboa Ghanafoo nyinaa—asuafoo, adwumayefoo ne mmusua—ma woahu MoMo nsisi, ahwehwe nokware a ewo scholarship mu, na woabo amannee.',
      ctaCheck: 'Hwe se eye scam a',
      ctaReport: 'Bo scam amannee',
      lowDataModeLabel: 'Static Shield (Data Saver)',
      enable3DLabel: 'Interactive 3D Shield',
      stepsTitle: 'Akwan 4 A CyberShield Fa So Bo Wo Ho Ban',
    },
    sections: {
      threatMapTitle: 'Nsisi A Yesi Kwan Ho Mfonini (Illustrative)',
      threatMapSubtitle:
        'Mfonini a ekyere senea yehu MoMo nsisi, scholarship atorofoo ne phishing wo Ghana nkurow akesee mu (Illustrative visualization).',
      threatEduTitle: 'Sua Nsisi Ahodoo 4 A Abu So Wo Ghana',
      threatEduSubtitle:
        'Hu senea nsisiifoo no ye won adwuma, nsenkyerenne a ekyere se eye atoro, ne nea ese se woye de bo wo sika ho ban.',
      spotScamTitle: 'Spot the Scam: Mia Nsem A Eye Hu So',
      spotScamSubtitle:
        'Mia nsem a eye adwene-mu-naa wo WhatsApp krataa yi mu na hu nsisi nsenkyerenne a ahunta wom.',
      checkerTitle: 'Eye Scam Anaa? Red-Flag Scanner',
      checkerSubtitle:
        'Yi nsenkyerenne a wuhu anaa fa krataa no hye ha na hwe se eye hu anaa.',
      quizTitle: 'Cyber Ahobammo Nsemmisa (Quiz)',
      quizSubtitle:
        'So wo nimdee hwe wo intanet ahobammo ho na kye wo nsunsuansoo wo WhatsApp so.',
      examplesTitle: 'Scam Nkrataa Pa A Yeakyerekyere Mu',
      examplesSubtitle:
        'Scam nkrataa a yeayi din ne noma afiri mu na yeakyere baabi a atoro no hye.',
      directoryTitle: 'Ghana Cybercrime Amanneebo Asoee',
      directorySubtitle:
        'Hwehwe aban ne telco asoee a wobetumi abo won amannee (placeholders marked for verification).',
      reportTitle: 'Bo Scam Amannee A Wommo Wo Din',
      reportSubtitle:
        'Boa ma yemmo Ghanafoo koko. Yemmisa wo din, wo noma, anaa wo MoMo nsem.',
      adminTitle: 'Admin Review & Community Alert Publisher',
      newsTitle: 'Cybersecurity Ne Global Tech News Sign-Up',
      creatorTitle: 'Reindolf Na Oyeee — Cybersecurity Suani Wo Ghana',
    },
  },
};
