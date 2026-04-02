'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';

const labels: Record<string, string> = {
  vi: 'VN',
  en: 'EN',
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('langSwitch');
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Replace the current locale prefix in the path
    const segments = pathname.split('/');
    if (routing.locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/'));
  };

  const nextLocale = locale === 'vi' ? 'en' : 'vi';

  return (
    <button
      onClick={() => switchLocale(nextLocale)}
      className="text-lg hover:opacity-80 transition-opacity"
      title={nextLocale === 'en' ? t('switchToEn') : t('switchToVi')}
    >
      {labels[nextLocale]}
    </button>
  );
}