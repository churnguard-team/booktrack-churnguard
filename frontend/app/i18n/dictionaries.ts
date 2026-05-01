import 'server-only';

const dictionaries = {
  fr: () => import('./locales/fr.json').then((module) => module.default),
  en: () => import('./locales/en.json').then((module) => module.default),
  ar: () => import('./locales/ar.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["fr"]>>;

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale]();
  }
  return dictionaries.fr(); // Default
};
