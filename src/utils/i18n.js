let locale = (navigator.language || "en").startsWith("en") ? "en" : "en";

const strings = {
  en: {
    simulator: "Simulator",
    defend: "Defend Earth",
    language: "Language"
  },
  ur: {
    simulator: "سمولیٹر",
    defend: "ڈیفینڈ ارتھ",
    language: "زبان"
  }
};

export function t(key){ return (strings[locale] && strings[locale][key]) || strings.en[key] || key; }
export function setLocale(lc){ locale = lc; }
export function getLocale(){ return locale; }
