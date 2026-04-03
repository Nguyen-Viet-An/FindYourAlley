import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

const Footer = async () => {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t bg-background">
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <Link href='/'>
          <Image
            src="/assets/images/squid.png"
            alt="logo"
            width={60}
            height={5}
          />
        </Link>

        <p>{t('copyright')}</p>

        <Link
          href="/donate"
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-400 transition-colors"
        >
          {t('donate')}
        </Link>
      </div>
    </footer>
  )
}

export default Footer