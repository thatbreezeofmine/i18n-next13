
import { getLocalePartsFrom, locales, ValidLocale, getTranslator } from "@/i18n";

export async function generateStaticParams() {
  return locales.map((locale) => getLocalePartsFrom({ locale }));
}

export default async function Home({
  params,
}: {
  params: { lang: string; country: string };
}) {
  const translate = await getTranslator(
    `${params.lang}-${params.country.toUpperCase()}` as ValidLocale // our middleware ensures this is valid
  );
  return (
    <div>
      <p>{JSON.stringify(params)}</p>
      <h1>{translate("welcome.helloWorld")}</h1>
    </div>
  );
}
