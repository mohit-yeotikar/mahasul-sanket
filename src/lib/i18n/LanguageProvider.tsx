"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Lang, type DictKey, t as translate } from "./dictionaries";

interface LangContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const Ctx = createContext<LangContext>({
  lang: "mr",
  setLang: () => {},
  t: (k) => translate(k, "mr"),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("mr");

  useEffect(() => {
    const saved = localStorage.getItem("ms-lang") as Lang | null;
    if (saved === "en" || saved === "mr") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ms-lang", l);
    document.documentElement.lang = l;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => translate(k, lang) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
