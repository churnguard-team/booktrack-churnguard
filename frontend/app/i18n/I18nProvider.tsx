"use client";

import { createContext, ReactNode } from "react";
import type { Dictionary } from "./dictionaries";

export interface I18nContextProps {
  dict: Dictionary;
  locale: string;
}

export const I18nContext = createContext<I18nContextProps | null>(null);

export default function I18nProvider({ 
  children, 
  dictionary,
  locale 
}: { 
  children: ReactNode; 
  dictionary: Dictionary;
  locale: string;
}) {
  return (
    <I18nContext.Provider value={{ dict: dictionary, locale }}>
      {children}
    </I18nContext.Provider>
  );
}
