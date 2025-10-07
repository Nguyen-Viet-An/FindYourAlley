'use server'
import { connectToDatabase } from '@/lib/database';
import Festival, { IFestival } from '@/lib/database/models/festival.model';
import { handleError } from '@/lib/utils';
import mongoose from 'mongoose';

export async function getFestivals(activeOnly = true) {
  try {
    await connectToDatabase();
    const query: any = {};
    if (activeOnly) query.isActive = true;
    const festivals = await Festival.find(query).sort({ startDate: -1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(festivals));
  } catch (e) {
    handleError(e);
  }
}

export async function ensureDefaultFestival() {
  try {
    await connectToDatabase();
    const existing = await Festival.findOne({ name: 'Color Fiesta 15' });
    if (!existing) {
      await Festival.create({ name: 'Color Fiesta 15', code: 'COFI15', isActive: true });
    }
  } catch (e) {
    handleError(e);
  }
}

export async function assignFestivalToAllEvents() {
  try {
    await connectToDatabase();
    const fest = await Festival.findOne({ name: 'Color Fiesta 15' });
    if (!fest) return;
    await mongoose.model('Event').updateMany(
      { $or: [{ festival: { $exists: false } }, { festival: null }] },
      { $set: { festival: fest._id } }
    );
  } catch (e) {
    handleError(e);
  }
}
