'use server'
import { connectToDatabase } from '@/lib/database';
import Festival, { IFestival } from '@/lib/database/models/festival.model';
import { handleError } from '@/lib/utils';
import mongoose from 'mongoose';
import { auth } from '@clerk/nextjs/server';

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  if (userId !== ADMIN_USER_ID) throw new Error('Unauthorized');
}

export async function getFestivals(activeOnly = true) {
  try {
    await connectToDatabase();
    const query: any = {};
    if (activeOnly) {
      query.$and = [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      ];
    }
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
      await Festival.create({
        name: 'Color Fiesta 15',
        code: 'COFI15',
        isActive: true,
        floorMapFile: 'Cofi floor map.drawio.xml',
        boothFile: 'booth-cofi15.json',
        stampRallyFile: 'stamprally.json',
      });
    }
  } catch (e) {
    handleError(e);
  }
}

export async function getFestivalById(id: string) {
  try {
    await connectToDatabase();
    const festival = await Festival.findById(id).lean();
    return festival ? JSON.parse(JSON.stringify(festival)) : null;
  } catch (e) {
    handleError(e);
    return null;
  }
}

export type CreateFestivalParams = {
  name: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
  isActive: boolean;
  floorMapFile?: string;
  boothFile?: string;
  stampRallyFile?: string;
};

export type UpdateFestivalParams = CreateFestivalParams & { _id: string };

export async function createFestival(data: CreateFestivalParams) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const festival = await Festival.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
    return JSON.parse(JSON.stringify(festival));
  } catch (e) {
    handleError(e);
  }
}

export async function updateFestival(data: UpdateFestivalParams) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const festival = await Festival.findByIdAndUpdate(
      data._id,
      {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      { new: true }
    );
    if (!festival) throw new Error('Festival not found');
    return JSON.parse(JSON.stringify(festival));
  } catch (e) {
    handleError(e);
  }
}

export async function deleteFestival(id: string) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const deleted = await Festival.findByIdAndDelete(id);
    if (!deleted) throw new Error('Festival not found');
    return JSON.parse(JSON.stringify(deleted));
  } catch (e) {
    handleError(e);
  }
}

export async function getAllFestivals() {
  try {
    await connectToDatabase();
    const festivals = await Festival.find().sort({ startDate: -1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(festivals));
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