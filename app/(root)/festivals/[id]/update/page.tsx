import FestivalForm from '@/components/shared/FestivalForm';
import { getFestivalById } from '@/lib/actions/festival.actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

type UpdateFestivalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UpdateFestivalPage({ params }: UpdateFestivalPageProps) {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  if (userId !== ADMIN_USER_ID) redirect('/');

  const { id } = await params;
  const festival = await getFestivalById(id);

  if (!festival) {
    return (
      <div className="wrapper my-8">
        <h1 className="h2-bold">Không tìm thấy festival</h1>
      </div>
    );
  }

  return (
    <div className="wrapper my-8 flex flex-col gap-6">
      <h1 className="h2-bold">Cập nhật Festival</h1>
      <FestivalForm type="Update" festival={festival} />
    </div>
  );
}
