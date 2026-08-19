// Marathi-first UI dictionary with English toggle.
// Add keys here only — components must never hardcode UI strings.

export type Lang = "mr" | "en";

const dict = {
  appName: { mr: "महसूल संकेत", en: "Mahasul Sanket" },
  tagline: {
    mr: "महाराष्ट्र महसूल विभाग — AI ज्ञान सहाय्यक",
    en: "Maharashtra Revenue Department — AI Knowledge Assistant",
  },
  // Auth
  login: { mr: "प्रवेश करा", en: "Sign in" },
  logout: { mr: "बाहेर पडा", en: "Sign out" },
  register: { mr: "नोंदणी करा", en: "Register" },
  mobile: { mr: "मोबाईल क्रमांक", en: "Mobile number" },
  password: { mr: "पासवर्ड", en: "Password" },
  confirmPassword: { mr: "पासवर्डची खात्री करा", en: "Confirm password" },
  fullName: { mr: "पूर्ण नाव", en: "Full name" },
  governmentId: { mr: "शासकीय ओळखपत्र क्रमांक (सेवार्थ ID)", en: "Government ID (Sevarth ID)" },
  district: { mr: "जिल्हा", en: "District" },
  taluka: { mr: "तालुका", en: "Taluka" },
  noAccount: { mr: "खाते नाही? नोंदणी करा", en: "No account? Register" },
  haveAccount: { mr: "आधीच खाते आहे? प्रवेश करा", en: "Already registered? Sign in" },
  pendingTitle: { mr: "खाते पडताळणीच्या प्रतीक्षेत", en: "Account pending verification" },
  pendingBody: {
    mr: "तुमची नोंदणी प्राप्त झाली आहे. तुमच्या जिल्ह्याचे DCO तुमचे शासकीय ओळखपत्र पडताळल्यानंतर खाते सक्रिय होईल.",
    en: "Your registration has been received. Your account will be activated after your district DCO verifies your Government ID.",
  },
  // Navigation
  dashboard: { mr: "मुख्यपृष्ठ", en: "Dashboard" },
  aiChat: { mr: "AI सहाय्यक", en: "AI Assistant" },
  knowledgeBase: { mr: "ज्ञान भांडार", en: "Knowledge Base" },
  seva: { mr: "सेवा", en: "Services" },
  tickets: { mr: "तिकिटे", en: "Tickets" },
  allCategories: { mr: "सर्व प्रकार", en: "All categories" },
  filterByService: { mr: "सेवेनुसार गाळा", en: "Filter by service" },
  dcoPanel: { mr: "DCO पॅनेल", en: "DCO Panel" },
  adminPanel: { mr: "प्रशासन", en: "Admin" },
  users: { mr: "वापरकर्ते", en: "Users" },
  reports: { mr: "अहवाल", en: "Reports" },
  officers: { mr: "क्षेत्रातील अधिकारी", en: "Area Officers" },
  notifications: { mr: "सूचना", en: "Notifications" },
  settings: { mr: "सेटिंग्ज", en: "Settings" },
  aiSettings: { mr: "AI सेटिंग्ज", en: "AI Settings" },
  grievances: { mr: "नागरिक तक्रारी", en: "Grievances" },
  profile: { mr: "प्रोफाइल", en: "Profile" },
  auditLogs: { mr: "लेखापरीक्षण नोंदी", en: "Audit Logs" },
  // Chat
  askPlaceholder: { mr: "तुमचा प्रश्न विचारा… (उदा. फेरफार नोंदीची प्रक्रिया काय आहे?)", en: "Ask your question… (e.g. What is the ferfar mutation process?)" },
  send: { mr: "पाठवा", en: "Send" },
  listening: { mr: "ऐकत आहे…", en: "Listening…" },
  confidence: { mr: "विश्वास", en: "Confidence" },
  sources: { mr: "संदर्भ", en: "Sources" },
  relatedQuestions: { mr: "संबंधित प्रश्न", en: "Related questions" },
  lowConfidence: {
    mr: "AI ला या प्रश्नाचे खात्रीशीर उत्तर सापडले नाही. तुम्ही तिकीट तयार करून वरिष्ठ अधिकाऱ्यांना विचारू शकता.",
    en: "The AI could not find a confident answer. You can raise a ticket to ask a senior officer.",
  },
  createTicket: { mr: "तिकीट तयार करा", en: "Create ticket" },
  notSatisfied: { mr: "उत्तर समाधानकारक नाही? अधिकाऱ्याला विचारा", en: "Not satisfied? Ask an officer" },
  copy: { mr: "कॉपी", en: "Copy" },
  regenerate: { mr: "पुन्हा तयार करा", en: "Regenerate" },
  newChat: { mr: "नवीन संभाषण", en: "New chat" },
  disclaimer: {
    mr: "टीप: हे AI-निर्मित उत्तर आहे. अधिकृत निर्णयासाठी मूळ शासन निर्णय/परिपत्रक पहा.",
    en: "Note: This is an AI-generated answer. Refer to the original GR/circular for official decisions.",
  },
  // Tickets
  subject: { mr: "विषय", en: "Subject" },
  description: { mr: "वर्णन", en: "Description" },
  category: { mr: "प्रकार", en: "Category" },
  priority: { mr: "प्राधान्य", en: "Priority" },
  status: { mr: "स्थिती", en: "Status" },
  escalate: { mr: "वरिष्ठ स्तरावर पाठवा", en: "Escalate" },
  reply: { mr: "उत्तर द्या", en: "Reply" },
  slaDays: { mr: "निराकरण कालावधी (दिवस)", en: "Resolution time (days)" },
  setSla: { mr: "कालावधी निश्चित करा", en: "Set resolution time" },
  resolve: { mr: "निराकरण झाले", en: "Mark resolved" },
  reopen: { mr: "पुन्हा उघडा", en: "Reopen" },
  proposeKnowledge: { mr: "ज्ञान भांडारात प्रस्तावित करा", en: "Propose as knowledge" },
  // Common
  loading: { mr: "लोड होत आहे…", en: "Loading…" },
  save: { mr: "जतन करा", en: "Save" },
  cancel: { mr: "रद्द करा", en: "Cancel" },
  search: { mr: "शोधा", en: "Search" },
  approve: { mr: "मंजूर करा", en: "Approve" },
  reject: { mr: "नाकारा", en: "Reject" },
  verify: { mr: "पडताळणी करा", en: "Verify" },
  upload: { mr: "अपलोड करा", en: "Upload" },
  darkMode: { mr: "गडद मोड", en: "Dark mode" },
  language: { mr: "भाषा", en: "Language" },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

export const ROLE_LABELS: Record<string, { mr: string; en: string }> = {
  citizen: { mr: "नागरिक", en: "Citizen" },
  talathi: { mr: "तलाठी", en: "Talathi" },
  circle_officer: { mr: "मंडळ अधिकारी", en: "Circle Officer" },
  nayab_tahsildar: { mr: "नायब तहसीलदार", en: "Nayab Tahsildar" },
  dco: { mr: "जिल्हा समन्वय अधिकारी (DCO)", en: "DCO" },
  district_admin: { mr: "जिल्हा प्रशासक", en: "District Admin" },
  state_admin: { mr: "राज्य प्रशासक", en: "State Admin" },
  super_admin: { mr: "सुपर ॲडमिन", en: "Super Admin" },
};

export const CATEGORY_LABELS: Record<string, { mr: string; en: string }> = {
  mutation: { mr: "फेरफार / म्युटेशन", en: "Mutation" },
  seven_twelve: { mr: "७/१२ उतारा", en: "7/12 Extract" },
  ferfar: { mr: "फेरफार नोंद", en: "Ferfar" },
  crop_entry: { mr: "पीक पाहणी नोंद", en: "Crop Entry" },
  inheritance: { mr: "वारस नोंद", en: "Inheritance" },
  revenue: { mr: "महसूल", en: "Revenue" },
  survey: { mr: "मोजणी", en: "Survey" },
  map: { mr: "नकाशा", en: "Map" },
  certificates: { mr: "दाखले", en: "Certificates" },
  digital_signature: { mr: "डिजिटल स्वाक्षरी", en: "Digital Signature" },
  technical_issue: { mr: "तांत्रिक अडचण", en: "Technical Issue" },
  others: { mr: "इतर", en: "Others" },
};
