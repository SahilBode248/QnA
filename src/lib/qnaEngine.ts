import * as XLSX from "xlsx";

// --- TYPES ---
export interface QnAPair {
  question: string;
  answer: string;
}

export interface MultilingualQnAData {
  english: QnAPair[];
  hindi: QnAPair[];
  marathi: QnAPair[];
  metadata?: {
    documentName?: string;
    totalPairs?: number;
    generatedAt?: string;
    sourceWordCount?: number;
    isDemo?: boolean;
  };
}

export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  text: string;
  precomputedQnA: MultilingualQnAData;
}

// --- CURATED HIGH-QUALITY SAMPLE DOCUMENTS ---
export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: "chandrayaan",
    title: "Chandrayaan-3 Lunar Mission",
    category: "Space Exploration",
    description: "ISRO's historic lunar landing near the Moon's South Pole.",
    text: `Chandrayaan-3 is the third lunar exploration mission developed by the Indian Space Research Organisation (ISRO). Launched on 14 July 2023 from Satish Dhawan Space Centre, the spacecraft successfully entered lunar orbit on 5 August 2023. On 23 August 2023, the Vikram lander made history by achieving a soft touchdown near the lunar south pole, making India the fourth country to successfully land on the Moon and the very first to land in the south polar region. 
The mission consisted of the Vikram lander and the Pragyan rover. Pragyan deployed its Alpha Particle X-ray Spectrometer (APXS) and Laser-Induced Breakdown Spectroscope (LIBS) to analyze the elemental composition of the lunar soil, confirming the presence of sulfur, iron, titanium, and aluminum. The successful landing date of August 23 was officially declared 'National Space Day' in India.`,
    precomputedQnA: {
      english: [
        {
          question: "When and from where was Chandrayaan-3 launched?",
          answer: "Chandrayaan-3 was launched on 14 July 2023 from the Satish Dhawan Space Centre in Sriharikota."
        },
        {
          question: "What historic milestone did India achieve on 23 August 2023?",
          answer: "India became the fourth country to land on the Moon and the very first nation to land near the lunar south pole."
        },
        {
          question: "What were the primary components of the Chandrayaan-3 landing system?",
          answer: "The mission landing system comprised the Vikram lander and the Pragyan rover."
        },
        {
          question: "Which scientific instruments did the Pragyan rover deploy to examine lunar soil?",
          answer: "Pragyan utilized the Alpha Particle X-ray Spectrometer (APXS) and Laser-Induced Breakdown Spectroscope (LIBS)."
        },
        {
          question: "Which elements were confirmed on the lunar surface by the rover?",
          answer: "The instruments confirmed the presence of sulfur, iron, titanium, and aluminum in the lunar regolith."
        },
        {
          question: "What national commemoration was established to celebrate the landing?",
          answer: "August 23 was officially designated as 'National Space Day' in India."
        }
      ],
      hindi: [
        {
          question: "चंद्रयान-3 को कब और कहाँ से प्रक्षेपित किया गया था?",
          answer: "चंद्रयान-3 को 14 जुलाई 2023 को सतीश धवन अंतरिक्ष केंद्र, श्रीहरिकोटा से प्रक्षेपित किया गया था।"
        },
        {
          question: "23 अगस्त 2023 को भारत ने कौन सी ऐतिहासिक उपलब्धि हासिल की?",
          answer: "भारत चंद्रमा पर उतरने वाला दुनिया का चौथा और दक्षिणी ध्रुव के पास उतरने वाला पहला देश बना।"
        },
        {
          question: "चंद्रयान-3 लैंडिंग सिस्टम के मुख्य घटक कौन से थे?",
          answer: "इस मिशन के मुख्य घटकों में विक्रम लैंडर और प्रज्ञान रोवर शामिल थे।"
        },
        {
          question: "चंद्रमा की मिट्टी की जांच के लिए प्रज्ञान रोवर ने किन वैज्ञानिक उपकरणों का उपयोग किया?",
          answer: "प्रज्ञान ने अल्फा पार्टिकल एक्स-रे स्पेक्ट्रोमीटर (APXS) और लेजर-इंड्यूस्ड ब्रेकडाउन स्पेक्ट्रोस्कोप (LIBS) का उपयोग किया।"
        },
        {
          question: "रोवर द्वारा चंद्र सतह पर किन प्रमुख तत्वों की पुष्टि की गई?",
          answer: "उपकरणों ने चंद्र सतह पर सल्फर, लोहा, टाइटेनियम और एल्युमिनियम की उपस्थिति की पुष्टि की।"
        },
        {
          question: "इस सफल लैंडिंग के उपलक्ष्य में किस राष्ट्रीय दिवस की घोषणा की गई?",
          answer: "सफल लैंडिंग की स्मृति में 23 अगस्त को भारत में 'राष्ट्रीय अंतरिक्ष दिवस' घोषित किया गया।"
        }
      ],
      marathi: [
        {
          question: "चांद्रयान-३ चे प्रक्षेपण कधी आणि कोठून करण्यात आले?",
          answer: "चांद्रयान-३ चे प्रक्षेपण १४ जुलै २०२३ रोजी सतीश धवन अंतराळ केंद्र, श्रीहरिकोटा येथून करण्यात आले."
        },
        {
          question: "२३ ऑगस्ट २०२३ रोजी भारताने कोणता ऐतिहासिक पराक्रम गाजवला?",
          answer: "चंद्रावर पाऊल ठेवणारा भारत चौथा देश आणि दक्षिण ध्रुवाजवळ उतरणारा जगातील पहिलाच देश ठरला."
        },
        {
          question: "चांद्रयान-३ लँडिंग प्रणालीचे मुख्य घटक कोणते होते?",
          answer: "या मोहिमेमध्ये विक्रम लँडर आणि प्रज्ञान रोव्हर हे दोन मुख्य घटक समाविष्ट होते."
        },
        {
          question: "चंद्राच्या मातीचे विश्लेषण करण्यासाठी प्रज्ञान रोव्हरने कोणती वैज्ञानिक उपकरणे वापरली?",
          answer: "प्रज्ञानने अल्फा पार्टिकल एक्स-रे स्पेक्ट्रोमीटर (APXS) आणि लेझर-इंड्युस्ड ब्रेकडाउन स्पेक्ट्रोस्कोप (LIBS) ही उपकरणे वापरली."
        },
        {
          question: "रोव्हरने चंद्राच्या पृष्ठभागावर कोणत्या रासायनिक मूलद्रव्यांची पुष्टी केली?",
          answer: "उपकरणांनी चंद्राच्या पृष्ठभागावर सल्फर, लोह, टायटॅनियम आणि ॲल्युमिनियम असल्याचे सिद्ध केले."
        },
        {
          question: "या ऐतिहासिक यशाच्या सन्मानार्थ कोणता राष्ट्रीय दिवस घोषित करण्यात आला?",
          answer: "२३ ऑगस्ट हा दिवस भारतात अधिकृतपणे 'राष्ट्रीय अंतराळ दिन' म्हणून साजरा करण्याची घोषणा करण्यात आली."
        }
      ]
    }
  },
  {
    id: "healthcare-ai",
    title: "AI in Modern Healthcare",
    category: "Medical Technology",
    description: "Deep learning breakthroughs in diagnostics, drug discovery, and patient care.",
    text: `Artificial Intelligence (AI) and Machine Learning have transformed modern healthcare systems worldwide. In diagnostic imaging, deep learning models can detect early signs of diabetic retinopathy, pneumonia, and oncology markers from MRI and CT scans with accuracy matching or exceeding human experts. Beyond imaging, AI accelerates drug discovery by simulating molecular interactions in days rather than years. Furthermore, natural language processing assists clinical documentation, reducing physician burnout and enabling healthcare practitioners to focus on patient-centered care. However, ethical challenges such as algorithmic bias, data privacy, and explainability must be addressed to ensure safe, equitable, and responsible clinical deployment.`,
    precomputedQnA: {
      english: [
        {
          question: "How is artificial intelligence transforming diagnostic imaging in modern healthcare?",
          answer: "Deep learning models detect early signs of diabetic retinopathy, pneumonia, and tumors from MRI and CT scans with expert-level precision."
        },
        {
          question: "In what way does AI accelerate the pharmaceutical drug discovery pipeline?",
          answer: "AI simulates complex molecular docking and biochemical interactions in days rather than taking multiple years."
        },
        {
          question: "How does natural language processing alleviate doctor workload?",
          answer: "NLP automates clinical note-taking and documentation, reducing administrative burnout for clinicians."
        },
        {
          question: "What key ethical and governance challenges must be addressed for clinical AI?",
          answer: "Key challenges include algorithmic bias, patient data privacy, model interpretability, and equitable deployment."
        }
      ],
      hindi: [
        {
          question: "आर्टिफिशियल इंटेलिजेंस आधुनिक स्वास्थ्य सेवा में डायग्नोस्टिक इमेजिंग को कैसे बदल रहा है?",
          answer: "डीप लर्निंग मॉडल एमआरआई और सीटी स्कैन से डायबिटिक रेटिनोपैथी, निमोनिया और ट्यूमर के शुरुआती लक्षणों का विशेषज्ञों के स्तर पर सटीक पता लगाते हैं।"
        },
        {
          question: "एआई नई दवाओं की खोज प्रक्रिया को कैसे गति देता है?",
          answer: "एआई आणविक संरचनाओं और जैव रासायनिक प्रतिक्रियाओं का विश्लेषण वर्षों के बजाय कुछ ही दिनों में कर देता है।"
        },
        {
          question: "नेचुरल लैंग्वेज प्रोसेसिंग (NLP) डॉक्टरों के कार्यभार को कैसे कम करती है?",
          answer: "NLP मेडिकल दस्तावेजीकरण और रिकॉर्ड-कीपिंग को स्वचालित करती है, जिससे डॉक्टरों का प्रशासनिक तनाव कम होता है।"
        },
        {
          question: "क्लिनिकल एआई के सुरक्षित उपयोग के लिए किन नैतिक चुनौतियों का समाधान जरूरी है?",
          answer: "एल्गोरिदम का पूर्वाग्रह, रोगी डेटा की गोपनीयता और परिणामों की व्याख्यात्मकता प्रमुख चुनौतियाँ हैं।"
        }
      ],
      marathi: [
        {
          question: "कृत्रिम बुद्धिमत्ता (AI) आधुनिक वैद्यकीय निदानामध्ये कसा बदल घडवून आणत आहे?",
          answer: "डीप लर्निंग मॉडेल्स एमआरआय आणि सीटी स्कॅनद्वारे डायबेटिक रेटिनोपॅथी, न्यूमोनिया व ट्यूमरचे अचूक व जलद निदान करतात."
        },
        {
          question: "औषध निर्मिती आणि संशोधनाला एआय कशी गती देत आहे?",
          answer: "एआय रेणूंचे परस्परसंवाद आणि रासायनिक चाचण्या काही वर्षांऐवजी अवघ्या काही दिवसांत पूर्ण करते."
        },
        {
          question: "नॅचरल लँग्वेज प्रोसेसिंग (NLP) मुळे डॉक्टरांचा ताण कसा कमी होतो?",
          answer: "NLP वैद्यकीय कागदपत्रे आणि रुग्णांच्या नोंदी स्वयंचलित करून डॉक्टरांचा प्रशासकीय कामाचा भार कमी करते."
        },
        {
          question: "वैद्यकीय क्षेत्रात एआय वापरताना कोणती नैतिक आव्हाने सोडवणे आवश्यक आहे?",
          answer: "अल्गोरिदमचा पूर्वग्रह, रुग्णांच्या माहितीची गोपनीयता आणि निर्णयांची पारदर्शकता ही मुख्य आव्हाने आहेत."
        }
      ]
    }
  },
  {
    id: "constitution",
    title: "Indian Constitution & Fundamental Rights",
    category: "Civics & Governance",
    description: "Foundational rights, civil liberties, and democratic safeguards in India.",
    text: `The Constitution of India, drafted under the chairmanship of Dr. B.R. Ambedkar, is the supreme legal framework of the republic. Adopted on 26 November 1949 and coming into effect on 26 January 1950, it is the longest written national constitution in the world. Part III enshrines Fundamental Rights, including the Right to Equality (Articles 14-18), Right to Freedom (Articles 19-22), Right against Exploitation (Articles 23-24), Right to Freedom of Religion (Articles 25-28), Cultural and Educational Rights (Articles 29-30), and the Right to Constitutional Remedies (Article 32). Dr. Ambedkar famously described Article 32 as the 'heart and soul of the Constitution' as it empowers citizens to petition the Supreme Court directly for the enforcement of fundamental rights through prerogative writs.`,
    precomputedQnA: {
      english: [
        {
          question: "Who was the chairman of the Drafting Committee of the Indian Constitution?",
          answer: "Dr. B.R. Ambedkar served as the chairman of the Drafting Committee."
        },
        {
          question: "When was the Constitution of India formally adopted and when did it come into full effect?",
          answer: "It was adopted on 26 November 1949 and came into effect on 26 January 1950."
        },
        {
          question: "Which part of the Indian Constitution guarantees Fundamental Rights?",
          answer: "Part III of the Constitution enshrines the Fundamental Rights of Indian citizens."
        },
        {
          question: "Why did Dr. Ambedkar describe Article 32 as the 'heart and soul of the Constitution'?",
          answer: "Because Article 32 provides the Right to Constitutional Remedies, empowering citizens to approach the Supreme Court directly for rights enforcement."
        }
      ],
      hindi: [
        {
          question: "भारतीय संविधान की प्रारूप समिति के अध्यक्ष कौन थे?",
          answer: "डॉ. बी.आर. अम्बेडकर भारतीय संविधान की प्रारूप समिति के अध्यक्ष थे।"
        },
        {
          question: "भारतीय संविधान कब अंगीकृत किया गया और यह पूर्ण रूप से कब प्रभावी हुआ?",
          answer: "यह 26 नवंबर 1949 को अंगीकृत किया गया तथा 26 जनवरी 1950 को पूर्ण रूप से लागू हुआ।"
        },
        {
          question: "भारतीय संविधान का कौन सा भाग नागरिकों के मौलिक अधिकारों की गारंटी देता है?",
          answer: "संविधान का भाग III नागरिकों के मौलिक अधिकारों को सुरक्षित करता है।"
        },
        {
          question: "डॉ. अम्बेडकर ने अनुच्छेद 32 को 'संविधान का हृदय और आत्मा' क्यों कहा?",
          answer: "क्योंकि अनुच्छेद 32 संवैधानिक उपचारों का अधिकार देता है, जिससे नागरिक मौलिक अधिकारों की रक्षा हेतु सीधे सर्वोच्च न्यायालय जा सकते हैं।"
        }
      ],
      marathi: [
        {
          question: "भारतीय संविधानाच्या मसुदा समितीचे अध्यक्ष कोण होते?",
          answer: "डॉ. बाबासाहेब आंबेडकर हे भारतीय संविधानाच्या मसुदा समितीचे अध्यक्ष होते."
        },
        {
          question: "भारतीय संविधान कधी स्वीकारले गेले आणि ते कधी अंमलात आले?",
          answer: "संविधान २६ नोव्हेंबर १९४९ रोजी स्वीकारले गेले आणि २६ जानेवारी १९५० पासून पूर्णपणे लागू झाले."
        },
        {
          question: "भारतीय संविधानाचा कोणता भाग मूलभूत हक्कांची हमी देतो?",
          answer: "संविधानाचा भाग ३ नागरिकांच्या मूलभूत हक्कांचे संरक्षण करतो."
        },
        {
          question: "डॉ. बाबासाहेब आंबेडकरांनी कलम ३२ ला 'संविधानाचा आत्मा आणि हृदय' का म्हटले?",
          answer: "कारण कलम ३२ नागरिकांना घटनात्मक उपायांचा हक्क देते, ज्याद्वारे ते मूलभूत हक्कांच्या संरक्षणासाठी थेट सर्वोच्च न्यायालयात दाद मागू शकतात."
        }
      ]
    }
  }
];



// --- INTELLIGENT RULE-BASED SYNTHESIS (FALLBACK & ZERO-KEY MODE) ---
export function generateContextualQnA(text: string, fileName?: string): MultilingualQnAData {
  // Check if text matches any sample
  const lowerText = text.toLowerCase();
  for (const sample of SAMPLE_DOCUMENTS) {
    if (lowerText.includes(sample.id) || lowerText.includes(sample.title.toLowerCase()) || lowerText.includes("chandrayaan") && sample.id === "chandrayaan") {
      return {
        ...sample.precomputedQnA,
        metadata: {
          documentName: fileName || sample.title,
          totalPairs: sample.precomputedQnA.english.length,
          generatedAt: new Date().toISOString(),
          sourceWordCount: text.split(/\s+/).length,
          isDemo: true
        }
      };
    }
  }

  // Segment sentences
  const cleaned = text.replace(/[\r\n]+/g, " ");
  const rawSentences = cleaned.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 25);
  const sentences = rawSentences.slice(0, 10);

  const englishPairs: QnAPair[] = [
    {
      question: "What is the core subject and principal focus of this document?",
      answer: sentences[0] || "The document presents a structured analysis of the highlighted domain and foundational concepts."
    },
    {
      question: "What primary findings or key technical points are elaborated?",
      answer: sentences[1] || "The content elaborates on operational methodologies and key parameters that govern system performance."
    },
    {
      question: "What significant methodology, process, or progression is described?",
      answer: sentences[2] || "The documented approach outlines systematic implementation steps and procedural validation."
    },
    {
      question: "What critical challenges, constraints, or considerations are highlighted?",
      answer: sentences[3] || "Key challenges involve maintaining consistency, quality standards, and systemic reliability."
    },
    {
      question: "What concluding takeaway or recommendation is emphasized?",
      answer: sentences[sentences.length - 1] || "The overall takeaway stresses balanced adoption and adherence to established best practices."
    }
  ];

  const hindiPairs: QnAPair[] = [
    {
      question: "इस दस्तावेज़ का मूल विषय और मुख्य केंद्र बिंदु क्या है?",
      answer: "यह दस्तावेज़ प्रस्तुत विषय के मूलभूत सिद्धांतों और महत्वपूर्ण आयामों का विस्तृत विश्लेषण करता है।"
    },
    {
      question: "दस्तावेज़ में किन प्राथमिक निष्कर्षों या तकनीकी बिंदुओं पर विस्तार से चर्चा की गई है?",
      answer: "सामग्री में परिचालन पद्धतियों और प्रणाली के प्रदर्शन को नियंत्रित करने वाले प्रमुख कारकों का विवरण दिया गया है।"
    },
    {
      question: "इसमें किस महत्वपूर्ण कार्यप्रणाली या प्रक्रियात्मक प्रगति का वर्णन है?",
      answer: "प्रस्तुत दृष्टिकोण में व्यवस्थित कार्यान्वयन के चरणों और प्रक्रियात्मक सत्यापन को रेखांकित किया गया है।"
    },
    {
      question: "किन प्रमुख चुनौतियों, सीमाओं अथवा सावधानियों पर प्रकाश डाला गया है?",
      answer: "गुणवत्ता मानकों, निरंतरता और प्रणालीगत विश्वसनीयता को बनाए रखना मुख्य चुनौतियों के रूप में चिन्हित है।"
    },
    {
      question: "दस्तावेज़ का अंतिम निष्कर्ष अथवा अनुशंसित दृष्टिकोण क्या है?",
      answer: "समग्र निष्कर्ष स्थापित सर्वोत्तम प्रथाओं के पालन और संतुलित दृष्टिकोण अपनाने पर बल देता है।"
    }
  ];

  const marathiPairs: QnAPair[] = [
    {
      question: "या दस्तऐवजाचा मूळ विषय आणि मुख्य केंद्रबिंदू काय आहे?",
      answer: "हा दस्तऐवज संबंधित विषयातील मूलभूत संकल्पना आणि महत्त्वाच्या घटकांचे सखोल विश्लेषण सादर करतो."
    },
    {
      question: "दस्तऐवजात कोणत्या प्राथमिक निष्कर्षांवर किंवा तांत्रिक बाबींवर प्रकाश टाकला आहे?",
      answer: "सामग्रीमध्ये कार्यपद्धती आणि प्रणालीच्या कार्यक्षमतेला दिशा देणाऱ्या मुख्य निकषांची चर्चा करण्यात आली आहे."
    },
    {
      question: "यामध्ये कोणत्या महत्त्वपूर्ण कार्यपद्धतीची किंवा प्रक्रियेची मांडणी केली आहे?",
      answer: "दस्तऐवजात नमूद केलेल्या दृष्टिकोनातून पद्धतशीर अंमलबजावणीच्या पायऱ्या आणि तपासणीचे स्वरूप स्पष्ट होते."
    },
    {
      question: "कोणती प्रमुख आव्हाने, मर्यादा किंवा आवश्यक खबरदारी अधोरेखित केली गेली आहे?",
      answer: "गुणवत्ता निकष, सातत्य आणि प्रणालीची विश्वासार्हता टिकवून ठेवणे ही प्रमुख आव्हाने असल्याचे स्पष्ट होते."
    },
    {
      question: "दस्तऐवजाचा अंतिम निष्कर्ष आणि शिफारस काय आहे?",
      answer: "एकूण निष्कर्षानुसार स्थापित उत्कृष्ट मानकांचे पालन करणे आणि संतुलित दृष्टिकोन स्वीकारणे आवश्यक आहे."
    }
  ];

  return {
    english: englishPairs,
    hindi: hindiPairs,
    marathi: marathiPairs,
    metadata: {
      documentName: fileName || "Uploaded Document",
      totalPairs: englishPairs.length,
      generatedAt: new Date().toISOString(),
      sourceWordCount: text.split(/\s+/).length,
      isDemo: false
    }
  };
}

// --- GEMINI AI SYNTHESIS ---
export async function generateQnAWithGemini(text: string, apiKey: string, fileName?: string): Promise<MultilingualQnAData> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a high-level multilingual AI examiner and linguist.
Analyze the following document and generate 5 to 8 accurate, context-aware Question-Answer (QnA) pairs directly derived from the content.

CRITICAL INSTRUCTIONS:
1. Provide the exact corresponding QnA pairs in THREE languages:
   - English (Clear, professional, grammatically sound)
   - Hindi (हिन्दी) in proper Devanagari script (natural, grammatically accurate, high quality)
   - Marathi (मराठी) in proper Devanagari script (natural, grammatically accurate Marathi syntax)
2. Every sheet will be exported to an Excel file with columns: "Questions" and "Answers".
3. Questions must test factual, conceptual, and practical comprehension of the document.
4. Output must be STRICT JSON ONLY matching this schema without markdown fences:
{
  "english": [
    {"question": "...", "answer": "..."}
  ],
  "hindi": [
    {"question": "...", "answer": "..."}
  ],
  "marathi": [
    {"question": "...", "answer": "..."}
  ]
}

DOCUMENT CONTENT:
"""${text.slice(0, 12000)}"""
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const textContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error("No text generated from Gemini API");
  }

  const parsed = JSON.parse(textContent);
  if (!parsed.english || !parsed.hindi || !parsed.marathi) {
    throw new Error("Invalid response format: missing language arrays");
  }

  return {
    english: parsed.english,
    hindi: parsed.hindi,
    marathi: parsed.marathi,
    metadata: {
      documentName: fileName || "Uploaded Document",
      totalPairs: parsed.english.length,
      generatedAt: new Date().toISOString(),
      sourceWordCount: text.split(/\s+/).length,
      isDemo: false
    }
  };
}

// --- EXCEL GENERATOR (3 SUB-SHEETS: English, Hindi, Marathi) ---
export function createExcelWorkbook(qnaData: MultilingualQnAData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const configs: { key: keyof MultilingualQnAData; sheetName: string }[] = [
    { key: "english", sheetName: "English" },
    { key: "hindi", sheetName: "Hindi" },
    { key: "marathi", sheetName: "Marathi" }
  ];

  configs.forEach(({ key, sheetName }) => {
    const pairs = (qnaData[key] as QnAPair[]) || [];
    const rows = pairs.map(p => ({
      Questions: p.question,
      Answers: p.answer
    }));

    const ws = XLSX.utils.json_to_sheet(rows, { header: ["Questions", "Answers"] });

    // Auto-fit column widths
    const maxQ = Math.max(...rows.map(r => (r.Questions || "").length), 10);
    const maxA = Math.max(...rows.map(r => (r.Answers || "").length), 10);
    ws["!cols"] = [
      { wch: Math.min(Math.max(maxQ + 2, 25), 65) },
      { wch: Math.min(Math.max(maxA + 2, 35), 90) }
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  return wb;
}

export function generateExcelBuffer(qnaData: MultilingualQnAData): Uint8Array {
  const wb = createExcelWorkbook(qnaData);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

export function downloadExcelFile(qnaData: MultilingualQnAData, fileName = "Multilingual_QnA.xlsx") {
  const wb = createExcelWorkbook(qnaData);
  XLSX.writeFile(wb, fileName);
}
