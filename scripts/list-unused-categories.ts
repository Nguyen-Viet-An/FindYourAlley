/**
 * Simple script to list unused categories
 * Usage: npm run list-unused-categories
 */
import 'dotenv/config'; // <-- load .env.local
import { config } from 'dotenv';
import { connectToDatabase } from '../lib/database';
import Category from '../lib/database/models/category.model';
import Event from '../lib/database/models/event.model';
import mongoose from 'mongoose';

async function listUnusedCategories() {
  try {
    config({ path: '.env.local' }); 
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    await connectToDatabase();
    
    // Find all category IDs that are used in events
    const usedCategoryIds = await Event.distinct('images.category');
    
    // Find categories that are NOT in the used list
    const unusedCategories = await Category.find({
      _id: { $nin: usedCategoryIds }
    }).select('_id name type').sort({ type: 1, name: 1 });
    
    console.log(`Found ${unusedCategories.length} unused categories:`);
    console.log('==========================================');
    
    if (unusedCategories.length === 0) {
      console.log('✅ All categories are being used!');
      return;
    }
    
    // Group by type
    const groupedByType = unusedCategories.reduce((acc: Record<string, any[]>, cat: any) => {
      if (!acc[cat.type]) {
        acc[cat.type] = [];
      }
      acc[cat.type].push(cat);
      return acc;
    }, {});
    
    // Display by type
    Object.keys(groupedByType).sort().forEach(type => {
      console.log(`\n${type.toUpperCase()}:`);
      groupedByType[type].forEach((cat: any) => {
        console.log(`  - ${cat.name} (${cat._id})`);
      });
    });
    
    console.log(`\nTotal unused: ${unusedCategories.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

listUnusedCategories();
