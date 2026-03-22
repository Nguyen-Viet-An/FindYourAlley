"use server";

import { connectToDatabase } from "@/lib/database";
import OcCard from "@/lib/database/models/ocCard.model";
import User from "@/lib/database/models/user.model";
import Festival from "@/lib/database/models/festival.model";
import { handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const populateCard = (query: any) =>
  query
    .populate({ path: "owner", model: User, select: "_id firstName lastName photo" })
    .populate({ path: "festival", model: Festival, select: "_id name code" });

// CREATE
export async function createOcCard({
  userId,
  card,
}: {
  userId: string;
  card: {
    ownerName: string;
    images: { ocName: string; artistName?: string; imageUrl: string; description?: string }[];
    festival?: string[];
    eventTime?: string;
    location?: string;
    appearance?: { text?: string; imageUrl?: string };
    contactMethod?: string;
  };
}) {
  try {
    await connectToDatabase();
    const newCard = await OcCard.create({ ...card, owner: userId });
    revalidatePath("/oc-cards");
    return JSON.parse(JSON.stringify(newCard));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE
export async function updateOcCard({
  userId,
  cardId,
  card,
}: {
  userId: string;
  cardId: string;
  card: {
    ownerName: string;
    images: { ocName: string; artistName?: string; imageUrl: string; description?: string }[];
    festival?: string[];
    eventTime?: string;
    location?: string;
    appearance?: { text?: string; imageUrl?: string };
    contactMethod?: string;
    available?: boolean;
  };
}) {
  try {
    await connectToDatabase();
    const existing = await OcCard.findById(cardId);
    if (!existing || existing.owner.toString() !== userId) {
      throw new Error("Unauthorized");
    }
    const updated = await OcCard.findByIdAndUpdate(
      cardId,
      { $set: card },
      { new: true }
    );
    revalidatePath("/oc-cards");
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteOcCard({
  userId,
  cardId,
}: {
  userId: string;
  cardId: string;
}) {
  try {
    await connectToDatabase();
    const existing = await OcCard.findById(cardId);
    if (!existing || existing.owner.toString() !== userId) {
      throw new Error("Unauthorized");
    }
    await OcCard.findByIdAndDelete(cardId);
    revalidatePath("/oc-cards");
  } catch (error) {
    handleError(error);
  }
}

// GET ALL CARDS (gallery)
export async function getAllOcCards({
  query,
  sortBy,
  festivalId,
}: {
  query?: string;
  sortBy?: string;
  festivalId?: string;
} = {}) {
  try {
    await connectToDatabase();

    const filter: any = {};
    if (query && query.trim().length >= 2) {
      const regex = new RegExp(query.trim(), "i");
      filter.$or = [
        { "images.ocName": regex },
        { "images.artistName": regex },
        { ownerName: regex },
      ];
    }

    if (festivalId) {
      filter.festival = festivalId;
    }

    let sort: any = { createdAt: -1 };
    if (sortBy === "alphabetical") sort = { "images.0.ocName": 1 };
    else if (sortBy === "oldest") sort = { createdAt: 1 };

    const cards = await populateCard(
      OcCard.find(filter).sort(sort)
    );
    return JSON.parse(JSON.stringify(cards));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET BY ID
export async function getOcCardById(cardId: string) {
  try {
    await connectToDatabase();
    const card = await populateCard(OcCard.findById(cardId));
    if (!card) throw new Error("Card not found");
    return JSON.parse(JSON.stringify(card));
  } catch (error) {
    handleError(error);
    return null;
  }
}

// GET CARDS BY USER
export async function getOcCardsByUser(userId: string) {
  try {
    await connectToDatabase();
    const cards = await populateCard(
      OcCard.find({ owner: userId }).sort({ createdAt: -1 })
    );
    return JSON.parse(JSON.stringify(cards));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// TOGGLE AVAILABILITY
export async function toggleOcCardAvailability({
  userId,
  cardId,
}: {
  userId: string;
  cardId: string;
}) {
  try {
    await connectToDatabase();
    const card = await OcCard.findById(cardId);
    if (!card || card.owner.toString() !== userId) {
      throw new Error("Unauthorized or card not found");
    }
    card.available = !card.available;
    await card.save();
    revalidatePath("/oc-cards");
    return JSON.parse(JSON.stringify(card));
  } catch (error) {
    handleError(error);
  }
}
