// scripts/assignFestivalToEvents.ts
import 'dotenv/config'; // <-- load .env.local
import { config } from 'dotenv';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';
import Festival from '@/lib/database/models/festival.model';
import Event from '@/lib/database/models/event.model';


async function main() {
  config({ path: '.env.local' }); 
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  await connectToDatabase();

  const festival = await Festival.findOne({ name: 'Color Fiesta 15' });
  if (!festival) {
    console.log('Festival not found!');
    process.exit(1);
  }

  const result = await Event.updateMany(
    { $or: [{ festival: { $exists: false } }, { festival: null }] },
    { $set: { festival: festival._id } }
  );

  console.log(`Updated ${result.modifiedCount} events with festival "${festival.name}"`);
  process.exit(0);
}

main().catch(console.error);
