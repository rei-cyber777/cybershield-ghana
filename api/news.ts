import { DigestNewsHeadline } from '../src/lib/doubleOptInCore';
import { ApiRequest, ApiResponse, sendJson } from './_utils';

export const LATEST_DIGEST_HEADLINES: DigestNewsHeadline[] = [
  {
    id: 'digest-1',
    title: 'How to Verify Mobile Money Balances Safely via Official USSD Before Reversing Funds',
    category: 'Ghana Scam Defense Guide',
    summary:
      'Never rely on an incoming SMS alert alone when a caller claims they sent money by mistake. Dial your official USSD balance menu first.',
    url: '/#threats',
    publishedAt: '2026-10-27',
  },
  {
    id: 'digest-2',
    title: 'Opportunity Bridge Checklist: How to Spot Fake University & Visa Processing Fee Scams',
    category: 'Student Safety & Scholarships',
    summary:
      'Genuine scholarships never request medical, visa, or protocol fees via personal Mobile Money wallets.',
    url: 'https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5',
    publishedAt: '2026-10-27',
  },
  {
    id: 'digest-3',
    title: 'Why Passkeys & Hardware-Backed 2FA Stop Phishing Links Cold',
    category: 'Global Tech & Authentication',
    summary:
      'How cryptographic passkeys bind credentials to the real domain name so lookalike phishing pages cannot steal your login.',
    url: '/#scam-checker',
    publishedAt: '2026-10-27',
  },
  {
    id: 'digest-4',
    title: 'Official Ghana Cybersecurity & Fraud Reporting Contacts',
    category: 'Official Directory',
    summary:
      'Direct verified contacts for CSA Ghana (292 / csa.gov.gh), Ghana Police Cybercrime Unit, Bank of Ghana, and SEC Ghana.',
    url: '/#directory',
    publishedAt: '2026-10-27',
  },
];

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed. Use GET.' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    updatedAt: new Date().toISOString(),
    items: LATEST_DIGEST_HEADLINES,
  });
}
