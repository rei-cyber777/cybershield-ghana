# Contributing to CyberShield Ghana

Thank you for helping protect Ghanaians from online fraud! **CyberShield Ghana** is a community-driven, open-source project. Students, security researchers, translators (Twi, Ga, Ewe, Dagbani, Hausa), and developers are welcome to contribute.

---

## Ways to Contribute

1. **Submit New Anonymized Scam Examples**: Share real scam formats you have encountered on WhatsApp, SMS, or social media using the template below.
2. **Improve Scam Checker Rules**: Add or refine weighted red-flag indicators in `src/lib/scamCheckerEngine.ts` (and add unit tests in `src/lib/scamCheckerEngine.test.ts`).
3. **Verify Authority Contact Channels**: Help verify official reporting numbers and portals in the Ghana Authorities Directory.
4. **Local Language Translations**: Expand our `src/lib/i18n.ts` dictionary with accurate local translations.

---

## Template: Contributing a New Scam Example

When opening a Pull Request or Issue with a new scam example, **strip all personal phone numbers, real names, and bank/MoMo account numbers** first. Use this template:

```json
{
  "id": "example-unique-slug",
  "title": "Short descriptive title (e.g., Fake Cash-Out Reversal SMS)",
  "category": "Mobile Money Fraud | Investment Scams | Fake Jobs & Scholarships | Phishing",
  "channel": "WhatsApp | SMS | Phone Call | Social Media",
  "anonymizedMessage": "Paste the message here with phone numbers replaced by [REDACTED-NUMBER] and links replaced by [SUSPICIOUS-LINK.example]",
  "annotations": [
    {
      "phrase": "Exact phrase from the message",
      "explanation": "Why this phrase is a red flag and how scammers use it."
    }
  ],
  "whatToDo": "1-2 clear sentences telling the reader how to verify or stay safe."
}
```

## Code Style & Privacy Rules

- **Zero Personal Data**: Never commit real phone numbers, victim names, or private identifiers.
- **No Unverified Facts**: Always mark illustrative visualizations clearly and never invent authority phone numbers.
- **Accessibility & Mobile First**: Ensure all interactive elements work with keyboards and respect `prefers-reduced-motion`.
