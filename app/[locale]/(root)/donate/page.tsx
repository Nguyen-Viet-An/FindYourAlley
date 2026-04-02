import { Heart } from "lucide-react";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('donate');
  return { title: t('pageTitle') };
}

export default async function DonatePage() {
  const t = await getTranslations('donate');

  return (
    <div className="wrapper py-8 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
        <Heart className="h-8 w-8 text-red-400" />
        {t('title')}
      </h1>
      <p className="text-muted-foreground mb-8">{t('intro')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* VN bank transfer */}
        <div className="rounded-lg border p-5 space-y-3 flex flex-col items-center">
          <p className="font-semibold text-lg">{t('bank')}</p>
          <Image
            src="/assets/images/bank-qr.jpg"
            alt="Bank QR Code"
            width={200}
            height={200}
            className="rounded-lg"
          />
          <p className="text-muted-foreground">{t('bankName')}</p>
          <p className="text-muted-foreground">{t('bankAccount')}</p>
          <p className="text-muted-foreground">{t('bankHolder')}</p>
        </div>

        {/* International Ko-fi */}
        <div className="rounded-lg border p-5 space-y-3 flex flex-col items-center">
          <p className="font-semibold text-lg">{t('international')}</p>
          <a
            href="https://ko-fi.com/myosotisdiamandis"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF5E5B] px-6 py-3 text-base font-medium text-white hover:bg-[#e54e4b] transition-colors"
          >
            ☕ {t('kofi')}
          </a>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-6">{t('thanks')}</p>
    </div>
  );
}
