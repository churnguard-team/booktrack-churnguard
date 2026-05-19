"use client";

import { useContext } from "react";
import { I18nContext } from "./I18nProvider";

export const useTranslation = () => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }

  // Fonction pour accéder aux clés imbriquées (ex: "navbar.novels")
  const t = (key: string, variables?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = context.dict;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Retourne la clé si introuvable
      }
    }

    if (typeof value === 'string' && variables) {
      return Object.entries(variables).reduce(
        (acc, [varName, varValue]) => acc.replace(new RegExp(`{${varName}}`, 'g'), String(varValue)),
        value
      );
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t, locale: context.locale };
};
