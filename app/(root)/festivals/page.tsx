import { getAllFestivals, deleteFestival } from '@/lib/actions/festival.actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FestivalDeleteButton from '@/components/shared/FestivalDeleteButton';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

export default async function FestivalsPage() {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  if (userId !== ADMIN_USER_ID) redirect('/');

  const festivals = await getAllFestivals();

  return (
    <div className="wrapper my-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">🎪 Quản lý Festival</h1>
        <Button asChild className="button">
          <Link href="/festivals/create">+ Tạo Festival</Link>
        </Button>
      </div>

      {!festivals || festivals.length === 0 ? (
        <div className="flex-center min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 dark:bg-muted py-28 text-center">
          <h3 className="p-bold-20 md:h5-bold">Chưa có festival nào</h3>
          <p className="p-regular-14">Hãy tạo festival đầu tiên.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {festivals.map((f: any) => (
            <div
              key={f._id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border bg-white dark:bg-card shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{f.name}</h3>
                  {f.code && (
                    <span className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-muted text-primary-500 rounded-full">
                      {f.code}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    f.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {f.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  {f.startDate && (
                    <span>📅 {new Date(f.startDate).toLocaleDateString('vi-VN')}
                      {f.endDate && ` - ${new Date(f.endDate).toLocaleDateString('vi-VN')}`}
                    </span>
                  )}
                  {f.expiresAt && (
                    <span>⏰ Ẩn sau: {new Date(f.expiresAt).toLocaleDateString('vi-VN')}</span>
                  )}
                </div>

                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  {f.floorMapFile && <span>🗺️ {f.floorMapFile}</span>}
                  {f.boothFile && <span>📋 {f.boothFile}</span>}
                  {f.stampRallyFile && <span>🎯 {f.stampRallyFile}</span>}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/festivals/${f._id}/update`}>Sửa</Link>
                </Button>
                <FestivalDeleteButton festivalId={f._id} festivalName={f.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}