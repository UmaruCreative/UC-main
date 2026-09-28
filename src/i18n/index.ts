import en, { type Dict } from "./en";
import fi from "./fi";
import sv from "./sv";
import fr from "./fr";
import no from "./no";

export const languages = {
  en: "English",
  fi: "Suomi",
  sv: "Svenska",
  fr: "Français",
  no: "Norsk",
} as const;

export type Lang = keyof typeof languages;
export const langs = Object.keys(languages) as Lang[];

const dicts: Record<Lang, Dict> = { en, fi, sv, fr, no };

export const SITE = "https://umaru-creative.com";

/** English is the default language and lives at the root; the others sit under /fi/, /sv/, /fr/, /no/. */
export function getLang(url: URL): Lang {
  const seg = url.pathname.split("/")[1] as Lang;
  return seg !== "en" && langs.includes(seg) ? seg : "en";
}

const prefix = (lang: Lang) => (lang === "en" ? "" : `/${lang}`);

/** Everything a component needs: the language, its copy and path helpers. */
export function useI18n(url: URL) {
  const lang = getLang(url);
  const l = (path: string) => `${prefix(lang)}${path}`;
  return {
    lang,
    t: dicts[lang],
    /** Prefix a site path with the current language, e.g. l("/pricing/") → "/fi/pricing/" (English: "/pricing/") */
    l,
    /** Absolute address of a page in the current language, for canonical tags and structured data */
    abs: (path: string) => `${SITE}${l(path)}`,
    /** Blog articles only exist in English for now */
    blog: (path = "/articles/") => path,
  };
}

/** The same page in another language. Articles fall back to that language's homepage. */
export function switchPath(url: URL, target: Lang) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length && langs.includes(parts[0] as Lang)) parts.shift();
  const rest = parts.length ? `${parts.join("/")}/` : "";
  if (rest.startsWith("articles")) return target === "en" ? url.pathname : `${prefix(target)}/`;
  return `${prefix(target)}/${rest}`;
}

/** Paths for the [...lang] routes: undefined gives the unprefixed English page */
export function getStaticLangPaths() {
  return langs.map((lang) => ({ params: { lang: lang === "en" ? undefined : lang } }));
}
