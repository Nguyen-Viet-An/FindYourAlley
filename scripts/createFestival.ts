// scripts/createFestival.ts
import { connectToDatabase } from '@/lib/database';
import Festival from '@/lib/database/models/festival.model';
import 'dotenv/config'; // <-- load .env.local
import { config } from 'dotenv';

async function main() {
    config({ path: '.env.local' }); 
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
  // Connect to your MongoDB
  await connectToDatabase();

  // Create a new festival document
  const newFestival = new Festival({
    name: 'Artist Day 12', // required
    code: 'AD12',          // optional
    startDate: new Date('2025-11-08'), // optional
    endDate: new Date('2025-11-09'),   // optional
    isActive: true            // defaults to true
  });

  // Save to the database
  await newFestival.save();

  console.log('Festival created:', newFestival);
  process.exit(0);
}

main().catch(console.error);
