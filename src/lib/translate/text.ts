import { hasExternalTranslator } from "@/lib/env";

const sentenceReplacements: Array<[RegExp, string]> = [
  [/무사고/g, "unfallfrei"],
  [/1인신조/g, "1. Hand"],
  [/완전무사고/g, "komplett unfallfrei"],
  [/비흡연차량/g, "Nichtraucherfahrzeug"],
  [/짧은km/g, "niedrige Laufleistung"],
  [/특A급관리/g, "sehr gut gepflegt"],
  [/내외관청결/g, "innen und aussen sauber"],
  [/상태양호차량/g, "guter Zustand"],
  [/정비완료차량/g, "Wartung erledigt"],
  [/특옵션차량/g, "mit Sonderausstattung"],
  [/성능기록/g, "Leistungs-/Zustandsnachweis"],
  [/보험이력/g, "Versicherungshistorie"],
  [/썬루프/g, "Schiebedach"],
  [/어댑티브크루즈/g, "adaptiver Tempomat"],
  [/어라운드뷰/g, "360-Grad-Kamera"],
  [/후카/g, "Rueckfahrkamera"],
  [/핸들열선/g, "Lenkradheizung"],
  [/시운전 가능/g, "Probefahrt moeglich"],
  [/누유/g, "Oelleck"],
  [/누수/g, "Kuehlmittel-/Wasserleck"],
  [/엔카진단/g, "Encar-Diagnose"],
  [/엔카보증/g, "Encar-Garantie"],
];

export function translateTextFallback(input: string | null | undefined) {
  if (!input) return "";

  let output = input;
  for (const [pattern, replacement] of sentenceReplacements) {
    output = output.replace(pattern, replacement);
  }

  return output;
}

async function translateWithOpenAI(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Translate Korean used-car listing text to concise German. Preserve technical car terms and do not invent facts.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_output_tokens: 1200,
    }),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    output_text?: string;
  };

  return json.output_text?.trim() || null;
}

async function translateWithDeepL(text: string) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    auth_key: apiKey,
    text,
    source_lang: "KO",
    target_lang: "DE",
    formality: "less",
  });

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    translations?: Array<{ text?: string }>;
  };

  return json.translations?.[0]?.text?.trim() || null;
}

export async function translateTextToGerman(input: string | null | undefined) {
  if (!input) return "";

  if (!hasExternalTranslator()) {
    return translateTextFallback(input);
  }

  const withDeepL = await translateWithDeepL(input);
  if (withDeepL) return withDeepL;

  const withOpenAI = await translateWithOpenAI(input);
  if (withOpenAI) return withOpenAI;

  return translateTextFallback(input);
}
