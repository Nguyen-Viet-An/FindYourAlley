import { BookOpen, PlusCircle, Pencil, Trash2, Search, Star, Tag, ImageIcon, Users, ArrowRight, HelpCircle, MapPin, Calendar, BarChart3, Map, User, Palette } from "lucide-react";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('guide');
  return { title: t('pageTitle') };
}

export default async function GuidePage() {
  const t = await getTranslations('guide');

  return (
    <div className="wrapper py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary-500" />
        {t('heading')}
      </h1>
      <p className="text-muted-foreground mb-8">
        {t('intro')}
      </p>

      {/* Section: Giới thiệu */}
      <Section icon={<Star className="h-5 w-5 text-yellow-500" />} title={t('whatIsTitle')}>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>{t('forSellersLabel')}</strong> {t('forSellers')}</li>
          <li><strong>{t('forBuyersLabel')}</strong> {t('forBuyers')}</li>
          <li><strong>{t('ocCardsLabel')}</strong> {t('ocCardsGuide')}</li>
          <li><strong>{t('featuredLabel')}</strong> {t('featuredGuide')}</li>
          <li><strong>{t('promoLabel')}</strong> {t('promoGuide')}</li>
        </ul>
      </Section>

      {/* Section: Đăng gian hàng */}
      <Section icon={<PlusCircle className="h-5 w-5 text-green-500" />} title={t('postBoothTitle')}>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>{t('postStep1')}</li>
          <li>{t('postStep2')}</li>
          <li>{t('postStep3')}</li>
          <li>{t('postStep4')}</li>
        </ol>
      </Section>

      {/* Section: Cách đặt tiêu đề */}
      <Section icon={<MapPin className="h-5 w-5 text-blue-500" />} title={t('titleGuideTitle')}>
        <p className="text-sm mb-3">
          {t('titleGuideIntro')}
        </p>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">{t('titleBoothCodeLabel')}</p>
          <p className="text-sm text-green-800 dark:text-green-300 mb-2">{t('titleBoothCodeDesc')}</p>
          <ul className="text-sm space-y-1 text-green-800 dark:text-green-300">
            <li><code className="bg-green-100 dark:bg-green-900 px-1 rounded">Q22</code>, <code className="bg-green-100 dark:bg-green-900 px-1 rounded">B12</code>, <code className="bg-green-100 dark:bg-green-900 px-1 rounded">A5</code></li>
          </ul>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">{t('titleBoothNameLabel')}</p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">{t('titleBoothNameDesc')}</p>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-300">
            <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Gà Rán</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Tiệm Mực</code></li>
          </ul>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">{t('titleAvoid')}</p>
          <ul className="text-sm space-y-1 text-red-800 dark:text-red-300">
            <li>{t('titleAvoidHint1')}</li>
            <li>{t('titleAvoidHint2')}</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 {t('titleSeparateHint')}
        </p>
      </Section>

      {/* Section: Ảnh */}
      <Section icon={<ImageIcon className="h-5 w-5 text-indigo-500" />} title={t('imageTitle')}>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('imageMultiple')}</li>
          <li>{t('imageSize')}</li>
          <li>{t('imageZoom')}</li>
          <li>{t('imageFeatured')}</li>
        </ul>
      </Section>

      {/* Section: Chỉnh sửa / xoá gian hàng */}
      <Section icon={<Pencil className="h-5 w-5 text-orange-500" />} title={t('editDeleteTitle')}>
        <div className="space-y-3 text-sm">
          <p>{t('editDeleteIntro')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('editIconDesc')}</li>
            <li>{t('deleteIconDesc')}</li>
          </ul>
          <p className="text-muted-foreground">
            {t('editDeleteWarning')}
          </p>
        </div>
      </Section>

      {/* Section: OC Cards */}
      <Section icon={<Users className="h-5 w-5 text-purple-500" />} title={t('ocCardsTradeTitle')}>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">{t('postOcCardLabel')}</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>{t('postOcStep1')}</li>
              <li>{t('postOcStep2')}</li>
              <li>{t('postOcStep3')}</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">{t('sendTradeLabel')}</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>{t('sendTradeStep1')}</li>
              <li>{t('sendTradeStep2')}</li>
              <li>{t('sendTradeStep3')}</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">{t('editOcLabel')}</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>{t('editOcStep1')}</li>
              <li>{t('editOcStep2')}</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Section: Tìm kiếm & lọc */}
      <Section icon={<Search className="h-5 w-5 text-cyan-500" />} title={t('searchFilterTitle')}>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>{t('searchBarLabel')}</strong> {t('searchBarDesc')}</li>
          <li><strong>{t('fandomFilterLabel')}</strong> {t('fandomFilterDesc')}</li>
          <li><strong>{t('itemFilterLabel')}</strong> {t('itemFilterDesc')}</li>
          <li><strong>{t('preorderFilterLabel')}</strong> {t('preorderFilterDesc')}</li>
          <li><strong>{t('festivalFilterLabel')}</strong> {t('festivalFilterDesc')}</li>
          <li><strong>{t('sortLabel')}</strong> {t('sortDesc')}</li>
        </ul>
      </Section>

      {/* Section: Bookmark */}
      <Section icon={<ImageIcon className="h-5 w-5 text-pink-500" />} title={t('bookmarkTitle')}>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('bookmarkStep1')}</li>
          <li>{t('bookmarkStep2')}</li>
          <li>{t('bookmarkStep3')}</li>
        </ul>
      </Section>

      {/* Section: Profile */}
      <Section icon={<User className="h-5 w-5 text-sky-500" />} title={t('profileTitle')}>
        <p className="text-sm mb-2">{t('profileIntro')}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>{t('profileSavedLabel')}</strong> {t('profileSavedDesc')}</li>
          <li><strong>{t('profilePostedLabel')}</strong> {t('profilePostedDesc')}</li>
          <li><strong>{t('profileOcLabel')}</strong> {t('profileOcDesc')}</li>
          <li><strong>{t('profileTradeLabel')}</strong> {t('profileTradeDesc')}</li>
          <li><strong>{t('profileExportLabel')}</strong> {t('profileExportDesc')}</li>
        </ul>
      </Section>

      {/* Section: Artists */}
      <Section icon={<Palette className="h-5 w-5 text-violet-500" />} title={t('artistsTitle')}>
        <p className="text-sm mb-2">{t('artistsNav')}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('artistsDesc1')}</li>
          <li>{t('artistsDesc2')}</li>
          <li>{t('artistsDesc3')}</li>
        </ul>
      </Section>

      {/* Section: Sơ đồ gian hàng */}
      <Section icon={<Map className="h-5 w-5 text-emerald-500" />} title={t('mapTitle')}>
        <p className="text-sm mb-2">{t('mapNav')}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('mapDesc1')}</li>
          <li>{t('mapDesc2')}</li>
          <li>{t('mapDesc3')}</li>
          <li>{t('mapDesc4')}</li>
        </ul>
      </Section>

      {/* Section: Thống kê */}
      <Section icon={<BarChart3 className="h-5 w-5 text-orange-500" />} title={t('statsTitle')}>
        <p className="text-sm mb-2">{t('statsNav')}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('statsDesc1')}</li>
          <li>{t('statsDesc2')}</li>
          <li>{t('statsDesc3')}</li>
          <li>{t('statsDesc4')}</li>
        </ul>
      </Section>

      {/* Section: Tags */}
      <Section icon={<Tag className="h-5 w-5 text-teal-500" />} title={t('tagsTitle')}>
        <p className="text-sm mb-2">{t('tagsNav')}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('tagsDesc1')}</li>
          <li>{t('tagsDesc2')}</li>
          <li>{t('tagsDesc3')}</li>
        </ul>
      </Section>

      {/* Section: FAQ */}
      <Section icon={<HelpCircle className="h-5 w-5 text-amber-500" />} title={t('faqTitle')}>
        <div className="space-y-4 text-sm">
          <FaqItem q={t('faq1q')} a={t('faq1a')} />
          <FaqItem q={t('faq2q')} a={t('faq2a')} />
          <FaqItem q={t('faq3q')} a={t('faq3a')} />
          <FaqItem q={t('faq4q')} a={t('faq4a')} />
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="pl-1">{children}</div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium">❓ {q}</p>
      <p className="text-muted-foreground mt-1">{a}</p>
    </div>
  );
}