// Shared draft-type definitions used by both the L1 draft generator UI and the
// server-side generateDraft() prompt. No server deps — safe to import anywhere.

export interface DraftField {
  key: string;
  mr: string;
  en: string;
  textarea?: boolean;
}

export interface DraftType {
  key: string;
  mr: string;
  en: string;
  fields: DraftField[];
  instruction: string; // extra guidance for the AI, per type
}

export const DRAFT_TYPES: DraftType[] = [
  {
    key: "namuna9",
    mr: "नमुना ९ नोटीस",
    en: "Namuna-9 notice",
    fields: [
      { key: "village", mr: "गाव", en: "Village" },
      { key: "gat", mr: "गट / सर्व्हे क्रमांक", en: "Gat / Survey no." },
      { key: "holder", mr: "खातेदाराचे नाव", en: "Holder name" },
      { key: "subject", mr: "विषय (उदा. वारस नोंद)", en: "Subject (e.g. inheritance)" },
      { key: "details", mr: "तपशील", en: "Details", textarea: true },
    ],
    instruction:
      "Draft a formal 'नमुना ९' notice under the Maharashtra Land Revenue Code inviting objections to a proposed mutation/ferfar entry. Include the standard heading, the proposed change, and a line giving 15 days to file objections at the Talathi/Circle office.",
  },
  {
    key: "ferfar",
    mr: "फेरफार नोंद मसुदा",
    en: "Ferfar (mutation) entry",
    fields: [
      { key: "gat", mr: "गट / सर्व्हे क्रमांक", en: "Gat / Survey no." },
      { key: "from_holder", mr: "पूर्वीचे धारक", en: "Previous holder(s)" },
      { key: "to_holder", mr: "नवीन धारक", en: "New holder(s)" },
      { key: "reason", mr: "कारण (खरेदी / वारस / बक्षीस)", en: "Reason (sale / inheritance / gift)" },
      { key: "reference", mr: "दस्त संदर्भ (असल्यास)", en: "Document reference (if any)" },
    ],
    instruction:
      "Draft the text of a mutation (ferfar) entry recording the transfer, in the concise register style used in the ferfar register. State the gat, the change of holders, the reason and any document reference provided.",
  },
  {
    key: "letter",
    mr: "अधिकृत पत्र",
    en: "Official letter",
    fields: [
      { key: "to", mr: "प्रति (कोणाला)", en: "To (recipient)" },
      { key: "subject", mr: "विषय", en: "Subject" },
      { key: "points", mr: "मुद्दे", en: "Points to cover", textarea: true },
    ],
    instruction:
      "Draft a formal Government of Maharashtra office letter (पत्र) with the standard 'प्रति / विषय / महोदय' structure, a clear body covering the given points, and a respectful closing. Keep it official and concise.",
  },
];
