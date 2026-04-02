import Link from "next/link";
import stamprally from "@/stamprally.json";
import { getTranslations } from 'next-intl/server';

type StampRally = {
  name: string;
  rules: string;
  booths: string[];
  artists: string[];
  link: string;
};

export default async function StampRallyPage() {
  const rallies: StampRally[] = stamprally.stampRallies;
  const t = await getTranslations('stamprally');

  return (
    <section className="wrapper my-8 flex flex-col gap-8">
      <h2 className="h2-bold">{t('title')}</h2>
      <p className="text-muted-foreground">
        {t('description', { count: rallies.length })}
      </p>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {rallies.map((rally, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold">{rally.name}</h3>
              {rally.link && (
                <a
                  href={rally.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline whitespace-nowrap"
                >
                  {t('details')}
                </a>
              )}
            </div>

            <div className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
              {rally.rules}
            </div>

            <div>
              <p className="text-sm font-semibold mb-1">{t('participatingBooths', { count: rally.booths.length })}:</p>
              <div className="flex flex-wrap gap-1.5">
                {rally.booths.map((booth) => (
                  <span
                    key={booth}
                    className="text-xs rounded-full bg-primary-500/10 px-2.5 py-1 text-primary-500 font-medium"
                  >
                    {booth}
                  </span>
                ))}
              </div>
            </div>

            {rally.artists.length > 0 && rally.artists[0] !== "" && (
              <div>
                <p className="text-sm font-semibold mb-1">Artists:</p>
                <div className="flex flex-wrap gap-1.5">
                  {rally.artists.map((artist, i) => (
                    <span
                      key={i}
                      className="text-xs rounded-full bg-muted px-2.5 py-1 text-muted-foreground"
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}