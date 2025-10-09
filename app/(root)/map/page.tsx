import { getBoothEventMap, getUniqueEventTitleCount } from '@/lib/actions/event.actions';
import InteractiveFloorplan from '@/components/shared/InteractiveFloorplan';
// import BoothSearch from '@/components/shared/BoothSearch';
import { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'Sơ đồ gian hàng | FindYourAlley',
  description: 'Sơ đồ tương tác các gian hàng tại sự kiện',
};

export default async function FloorplanPage() {
  const boothMap = await getBoothEventMap();
  const uniqueEventTitleCount = await getUniqueEventTitleCount();

  // Load the XML floor map data
  let xmlContent = '';
  try {
    const xmlPath = path.join(process.cwd(), 'Cofi floor map.drawio.xml');
    xmlContent = await fs.readFile(xmlPath, 'utf-8');
  } catch (error) {
    console.error('Error loading XML floor map:', error);
  }

  // Load booth names from JSON file
  let boothNamesData: { [key: string]: string } = {};
  try {
    const boothNamesPath = path.join(process.cwd(), 'booth.json');
    const boothNamesContent = await fs.readFile(boothNamesPath, 'utf-8');
    boothNamesData = JSON.parse(boothNamesContent);
  } catch (error) {
    console.error('Error loading booth names:', error);
  }

  // Load stamp rally data from JSON file
  let stampRallyData: any = { stampRallies: [] };
  try {
    const stampRallyPath = path.join(process.cwd(), 'stamprally.json');
    const stampRallyContent = await fs.readFile(stampRallyPath, 'utf-8');
    stampRallyData = JSON.parse(stampRallyContent);
  } catch (error) {
    console.error('Error loading stamp rally data:', error);
  }

  const handleBoothSearch = (code: string) => {
    // This will be handled by the client-side component
    console.log('Searching for booth:', code);
  };

  return (
    <div className="wrapper my-8">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="h2-bold">🗺️ Sơ đồ gian hàng</h1>
          <p className="text-gray-600 mt-2">
            Di chuột qua các gian để xem sample, click để xem chi tiết
          </p>
        </div>

        {/* Statistics
        <div className="flex justify-center gap-8 text-sm text-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-500">
              {Object.keys(boothMap).length}
            </div>
            <div>Gian có event</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {406 - Object.keys(boothMap).length}
            </div>
            <div>Gian trống</div>
          </div>
        </div> */}

        {/* Floorplan Component */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <InteractiveFloorplan
            boothMap={boothMap}
            xmlContent={xmlContent}
            uniqueEventTitleCount={uniqueEventTitleCount}
            boothNames={boothNamesData}
            stampRallies={stampRallyData.stampRallies}
          />
        </div>

        {/* Instructions
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h3 className="font-medium text-blue-800 mb-2">💡 Hướng dẫn sử dụng:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• <strong>Di chuột</strong> qua các gian để xem preview sample</li>
            <li>• <strong>Click</strong> vào gian để xem thông tin chi tiết</li>
            <li>• <strong>Tìm kiếm</strong> theo số gian ở ô tìm kiếm phía trên</li>
            <li>• Gian màu <span className="text-blue-600 font-medium">xanh</span> có sample, gian màu xám là trống</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
}
