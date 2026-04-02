import FestivalForm from '@/components/shared/FestivalForm';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

export default async function CreateFestivalPage() {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  if (userId !== ADMIN_USER_ID) redirect('/');
  const t = await getTranslations('festivalManage');

  return (
    <div className="wrapper my-8 flex flex-col gap-6">
      <h1 className="h2-bold">{t('createTitle')}</h1>
      <FestivalForm type="Create" />
    </div>
  );
}