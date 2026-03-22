import { getBoothEventMap, getUniqueEventTitleCount } from '@/lib/actions/event.actions';
import { getFestivals, getFestivalById } from '@/lib/actions/festival.actions';
import InteractiveFloorplan from '@/components/shared/InteractiveFloorplan';
import { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'Sơ đồ gian hàng | FindYourAlley',
  description: 'Sơ đồ tương tác các gian hàng tại sự kiện',
};

type MapPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FloorplanPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const festivals = await getFestivals(true);
  const festivalId = (params?.festivalId as string) || festivals[0]?._id || undefined;
  const festival = festivalId ? await getFestivalById(festivalId) : null;

  // Use festival-specific files or defaults
  const floorMapFile = festival?.floorMapFile || 'Cofi floor map.drawio.xml';
  const boothFile = festival?.boothFile || 'booth.json';
  const stampRallyFile = festival?.stampRallyFile || 'stamprally.json';

  const boothMap = await getBoothEventMap();

  // Load the XML floor map data
  let xmlContent = '';
  try {
    const xmlPath = path.join(process.cwd(), floorMapFile);
    xmlContent = await fs.readFile(xmlPath, 'utf-8');
  } catch (error) {
    console.error('Error loading XML floor map:', error);
  }

  // Load booth names from JSON file
  let boothNamesData: { [key: string]: string } = {};
  try {
    const boothNamesPath = path.join(process.cwd(), boothFile);
    const boothNamesContent = await fs.readFile(boothNamesPath, 'utf-8');
    boothNamesData = JSON.parse(boothNamesContent);
  } catch (error) {
    console.error('Error loading booth names:', error);
  }

  // Load stamp rally data from JSON file (only if file is specified)
  let stampRallyData: any = { stampRallies: [] };
  if (stampRallyFile) {
    try {
      const stampRallyPath = path.join(process.cwd(), stampRallyFile);
      const stampRallyContent = await fs.readFile(stampRallyPath, 'utf-8');
      stampRallyData = JSON.parse(stampRallyContent);
    } catch (error) {
      // No stamp rally for this festival - that's fine
    }
  }

  const festivalName = festival?.code || festival?.name || '';

  return (
    <div className="wrapper my-8">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="h2-bold">🗺️ Sơ đồ gian hàng {festivalName && `- ${festivalName}`}</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            Di chuột qua các gian để xem sample, click để xem chi tiết
          </p>
        </div>

        {xmlContent ? (
          <div className="bg-white dark:bg-card rounded-lg shadow-sm border p-4">
            <InteractiveFloorplan
              boothMap={boothMap}
              xmlContent={xmlContent}
              boothNames={boothNamesData}
              stampRallies={stampRallyData.stampRallies}
            />
          </div>
        ) : (
          <div className="flex-center min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 dark:bg-muted py-28 text-center">
            <h3 className="p-bold-20 md:h5-bold">Chưa có sơ đồ cho festival này</h3>
            <p className="p-regular-14">Sơ đồ gian hàng sẽ được cập nhật sau.</p>
          </div>
        )}
      </div>
    </div>
  );
}
