export const defaultLocale = "en-US";
export const defaultLocales = ["en-US", "en-CA", "fr-FR", "fr-BE"] as const;
export const locales = ["en-US", "en-CA", "fr-CA", "fr-FR", "fr-BE"] as const;
export type ValidLocale = typeof locales[number];

type PathnameLocale = {
    pathname: string;
    locale?: never;
};
type ISOLocale = {
    pathname?: never;
    locale: string;
};

type LocaleSource = PathnameLocale | ISOLocale;

export const getLocalePartsFrom = ({ pathname, locale }: LocaleSource) => {
    if (locale) {
        const localeParts = locale.toLowerCase().split("-");
        return {
            country: localeParts[1],
            lang: localeParts[0],
        };
    } else {
        const pathnameParts = pathname!.toLowerCase().split("/");

        return {
            country: pathnameParts[1],
            lang: pathnameParts[2],
        };

    }
};

//create a dictionary for each locale
export const dictionaries: Record<ValidLocale, any> = {
    "en-US": () =>
        import("dictionaries/en-US.json").then((module) => module.default),
    "en-CA": () =>
        import("dictionaries/en-CA.json").then((module) => module.default),
    "fr-CA": () =>
        import("dictionaries/fr-CA.json").then((module) => module.default),
    "fr-FR": () =>
        import("dictionaries/fr-FR.json").then((module) => module.default),
    "fr-BE": () =>  
        import("dictionaries/fr-BE.json").then((module) => module.default),
} as const;

export const getTranslator = async (locale: ValidLocale) => {
    const dictionary = await dictionaries[locale]();
    return (key: string, params?: { [key: string]: string | number }) => {
        let translation = key
            .split(".")
            .reduce((obj, key) => obj && obj[key], dictionary);
        if (!translation) {
            return key;
        }
        if (params && Object.entries(params).length) {
            Object.entries(params).forEach(([key, value]) => {
                translation = translation!.replace(`{{ ${key} }}`, String(value));
            });
        }
        return translation;
    };
};