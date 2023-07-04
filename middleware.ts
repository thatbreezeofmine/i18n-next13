import { NextRequest, NextResponse } from "next/server";

import langParser from "accept-language-parser";

import { defaultLocale, locales, getLocalePartsFrom, defaultLocales } from "./i18n";

const findBestMatchingLocale = (acceptLangHeader: string, currentPathnameParts: any) => {
  // parse the locales acceptable in the header, and sort them by priority (q)
  const parsedLangs = langParser.parse(acceptLangHeader);

  // find the first locale that matches a locale in our list
  for (let i = 0; i < parsedLangs.length; i++) {
    const parsedLang = parsedLangs[i];
    // attempt to match both the language and the country
    const matchedLocale = locales.find((locale) => {
      const localeParts = getLocalePartsFrom({ locale });
      return (
        parsedLang.code === localeParts.lang &&
        parsedLang.region === localeParts.country
      );
    });
    if (matchedLocale) {
      return matchedLocale;
    }
    // if we didn't find a match for both language and country, try just the country
    else {
      const matchedCountry = defaultLocales.find((locale) => {
        const localeParts = getLocalePartsFrom({ locale });
        return currentPathnameParts.country === localeParts.country;
      });
      if (matchedCountry ) {
        return matchedCountry;
      } 
      else {
        // if we didn't find a match for both language and country, try just the language
        const matchedLanguage = locales.find((locale) => {
          const localeParts = getLocalePartsFrom({ locale });
          return parsedLang.code === localeParts.lang;
        });
        

        if (matchedLanguage && !matchedLanguage.includes("en-US")) {
          return matchedLanguage;
        }
      }
    }
  }

  // if we didn't find a match, return the default locale
  return defaultLocale;
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  var defaultLocaleParts = getLocalePartsFrom({ locale: defaultLocale });
  const currentPathnameParts = getLocalePartsFrom({ pathname });

  // Check if the default locale is in the pathname
  if (
    currentPathnameParts.lang === defaultLocaleParts.lang &&
    currentPathnameParts.country === defaultLocaleParts.country
  ) {
    // we want to REMOVE the default locale from the pathname,
    // and later use a rewrite so that Next will still match
    // the correct code file as if there was a locale in the pathname
    return NextResponse.redirect(
      new URL(
        pathname.replace(
          `/${defaultLocaleParts.country}/${defaultLocaleParts.lang}`,
          pathname.split('/').length > 3 ? "" : "/"
        ),
        request.url
      )
    );
  }

  var defaultLang: any = defaultLocales.filter((locale) => {
    const mylocaleParts = getLocalePartsFrom({ locale });
    return (
      currentPathnameParts.country === mylocaleParts.country
    );
  });

  if (defaultLang.length > 0) {
    const matchedLocaleParts = getLocalePartsFrom({ locale: defaultLang[0] })
    if (matchedLocaleParts.lang === currentPathnameParts.lang) {
      return NextResponse.redirect(
        new URL(
          `/${matchedLocaleParts.country}${pathname.replace("/" + matchedLocaleParts.country + "/" + matchedLocaleParts.lang, "")}`,
          request.url
        )
      );
    }
  }

  const pathnameIsMissingValidLocale = locales.every((locale) => {
    const localeParts = getLocalePartsFrom({ locale });

    return !pathname.startsWith(`/${localeParts.country}/${localeParts.lang}`);
  });

  if (pathnameIsMissingValidLocale) {
    // rewrite it so next.js will render `/` as if it was `/us/en`
    const matchedLocale = findBestMatchingLocale(
      request.headers.get("Accept-Language") || defaultLocale, currentPathnameParts
    );

    const localeParts = getLocalePartsFrom({ locale: matchedLocale });
    if (pathname.startsWith(`/${localeParts.country}`)) {
      var defaultLang: any = defaultLocales.filter((locale) => {
        const mylocaleParts = getLocalePartsFrom({ locale });
        return (
          localeParts.country === mylocaleParts.country
        );
      });

      if (defaultLang.length > 0) {
        const matchedLocaleParts = getLocalePartsFrom({ locale: defaultLang[0] })
        if (matchedLocaleParts.country === getLocalePartsFrom({ locale: defaultLocale }).country) {
          return NextResponse.redirect(
            new URL(
              pathname.replace(
                `/${defaultLocaleParts.country}`,
                ""
              ),
              request.url
            ))
        };
        return NextResponse.rewrite(
          new URL(
            `/${matchedLocaleParts.country}/${matchedLocaleParts.lang}${pathname.replace("/" + matchedLocaleParts.country, "")}`,
            request.url
          )
        );
      }
    }

    if (matchedLocale !== defaultLocale) {

      const matchedLocaleParts = getLocalePartsFrom({ locale: matchedLocale });

      var defaultLang: any = defaultLocales.filter((locale) => {
        const mylocaleParts = getLocalePartsFrom({ locale });
        return (
          matchedLocaleParts.country === mylocaleParts.country
        );
      });

      const localeParts = getLocalePartsFrom({ locale: defaultLang[0] });
      // console.log(localeParts.lang, matchedLocaleParts.lang)
      if (localeParts.lang == matchedLocaleParts.lang) {
        return NextResponse.redirect(
          new URL(
            `/${matchedLocaleParts.country}${pathname}`,
            request.url
          )
        );
      }

      return NextResponse.redirect(
        new URL(
          `/${matchedLocaleParts.country}/${matchedLocaleParts.lang}${pathname}`,
          request.url
        )
      );
    } else {

      return NextResponse.rewrite(
        new URL(
          `/${defaultLocaleParts.country}/${defaultLocaleParts.lang}${pathname}`,
          request.url
        )
      );
    }
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)",
  ],
};