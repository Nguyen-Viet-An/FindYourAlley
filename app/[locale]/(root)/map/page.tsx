import { getBoothEventMap, getUniqueEventTitleCount } from '@/lib/actions/event.actions';
import { getFestivals } from '@/lib/actions/festival.actions';
import InteractiveFloorplan from '@/components/shared/InteractiveFloorplan';
import DayFilter from '@/components/shared/DayFilter';
import { hasRegisteredLayout } from '@/lib/utils/boothLayout';
import { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

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
  const festivalCode = (params?.festival as string) || festivals[0]?.code || undefined;
  const festival = festivals.find((f: any) => f.code === festivalCode) || festivals[0] || null;
  const festivalId = festival?._id;

  // Day filter for multi-day festivals
  const festivalDayParam = params?.festivalDay ? Number(params.festivalDay) : undefined;

  // Use festival-specific files; no fallback so festivals without a map show "no map" message
  const floorMapFile = festival?.floorMapFile || '';
  const boothFile = festival?.boothFile || '';
  const hasLayout = hasRegisteredLayout(festival?.code);

  const boothMap = (floorMapFile || hasLayout) ? await getBoothEventMap(festivalId, festivalDayParam) : {};

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
  if (boothFile) {
    try {
      const boothNamesPath = path.join(process.cwd(), boothFile);
      const boothNamesContent = await fs.readFile(boothNamesPath, 'utf-8');
      const parsed = JSON.parse(boothNamesContent);

      // Support per-day format: { "1": {...}, "2": {...} } vs flat { "A1": "name", ... }
      if (parsed["1"] && typeof parsed["1"] === 'object' && !Array.isArray(parsed["1"])) {
        const dayKey = festivalDayParam ? String(festivalDayParam) : undefined;
        if (dayKey && parsed[dayKey]) {
          boothNamesData = parsed[dayKey];
        } else {
          // No day selected — merge all days with day labels for different names
          const days = Object.keys(parsed).sort();
          const codesByDay: Record<string, Record<string, string>> = {};
          for (const day of days) {
            for (const [code, name] of Object.entries(parsed[day] as Record<string, string>)) {
              if (!codesByDay[code]) codesByDay[code] = {};
              codesByDay[code][day] = name;
            }
          }
          for (const [code, dayNames] of Object.entries(codesByDay)) {
            const uniqueNames = [...new Set(Object.values(dayNames))];
            if (uniqueNames.length === 1) {
              boothNamesData[code] = uniqueNames[0];
            } else {
              boothNamesData[code] = Object.entries(dayNames)
                .map(([day, name]) => `Ngày ${day}: ${name}`)
                .join('\n');
            }
          }
        }
      } else {
        boothNamesData = parsed;
      }
    } catch (error) {
      console.error('Error loading booth names:', error);
    }
  }

  // Load stamp rally data only if the festival has its own file
  let stampRallyData: any = { stampRallies: [] };
  if (festival?.stampRallyFile) {
    try {
      const stampRallyPath = path.join(process.cwd(), festival.stampRallyFile);
      const stampRallyContent = await fs.readFile(stampRallyPath, 'utf-8');
      stampRallyData = JSON.parse(stampRallyContent);
    } catch (error) {
      // No stamp rally for this festival - that's fine
    }
  }

  const festivalName = festival?.code || festival?.name || '';
  const t = await getTranslations('map');

  return (
    <div className="wrapper my-8">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="h2-bold">🗺️ {t('title')} {festivalName && `- ${festivalName}`}</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
          {festival?.startDate && festival?.endDate && (
            <div className="mt-3 flex justify-center">
              <DayFilter startDate={festival.startDate} endDate={festival.endDate} />
            </div>
          )}
        </div>

        {(xmlContent || hasLayout) ? (
          <div className="bg-white dark:bg-card rounded-lg shadow-sm border p-4">
            <InteractiveFloorplan
              boothMap={boothMap}
              xmlContent={xmlContent}
              boothNames={boothNamesData}
              stampRallies={stampRallyData.stampRallies}
              festivalCode={festival?.code}
            />
          </div>
        ) : (
          <div className="flex-center min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 dark:bg-muted py-28 text-center">
            <h3 className="p-bold-20 md:h5-bold">{t('noMap')}</h3>
            <p className="p-regular-14">{t('noMapHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}