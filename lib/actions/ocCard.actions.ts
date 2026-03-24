"use server";

import { connectToDatabase } from "@/lib/database";
import OcCard from "@/lib/database/models/ocCard.model";
import TradeRequest from "@/lib/database/models/tradeRequest.model";
import User from "@/lib/database/models/user.model";
import Festival from "@/lib/database/models/festival.model";
import { handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function r2KeyFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

async function deleteR2Objects(keys: string[]) {
  const objects = keys.filter(Boolean).map((k) => ({ Key: k }));
  if (objects.length === 0) return;
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Delete: { Objects: objects },
    })
  );
}

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
    // Collect R2 keys for all images + appearance image
    const r2Keys: string[] = [];
    for (const img of existing.images) {
      const key = r2KeyFromUrl(img.imageUrl);
      if (key) r2Keys.push(key);
    }
    if (existing.appearance?.imageUrl) {
      const key = r2KeyFromUrl(existing.appearance.imageUrl);
      if (key) r2Keys.push(key);
    }
    // Delete all trade requests targeting this card
    await TradeRequest.deleteMany({ card: cardId });
    // Unset linkedCard references in other trade requests
    await TradeRequest.updateMany(
      { linkedCard: cardId },
      { $unset: { linkedCard: "" } }
    );
    await OcCard.findByIdAndDelete(cardId);
    // Delete images from R2
    await deleteR2Objects(r2Keys);
    revalidatePath("/oc-cards");
  } catch (error) {
    handleError(error);
  }
}

// DELETE SINGLE IMAGE from a multi-image card
export async function deleteOcCardImage({
  userId,
  cardId,
  imageIndex,
}: {
  userId: string;
  cardId: string;
  imageIndex: number;
}) {
  try {
    await connectToDatabase();
    const existing = await OcCard.findById(cardId);
    if (!existing || existing.owner.toString() !== userId) {
      throw new Error("Unauthorized");
    }
    // If only 1 image left, delete the whole card
    if (existing.images.length <= 1) {
      const r2Keys: string[] = [];
      const key = r2KeyFromUrl(existing.images[0]?.imageUrl);
      if (key) r2Keys.push(key);
      if (existing.appearance?.imageUrl) {
        const aKey = r2KeyFromUrl(existing.appearance.imageUrl);
        if (aKey) r2Keys.push(aKey);
      }
      await TradeRequest.deleteMany({ card: cardId });
      await TradeRequest.updateMany(
        { linkedCard: cardId },
        { $unset: { linkedCard: "" } }
      );
      await OcCard.findByIdAndDelete(cardId);
      await deleteR2Objects(r2Keys);
      revalidatePath("/oc-cards");
      return { deleted: true };
    }
    // Delete the single image from R2
    const removedImage = existing.images[imageIndex];
    if (removedImage?.imageUrl) {
      const key = r2KeyFromUrl(removedImage.imageUrl);
      if (key) await deleteR2Objects([key]);
    }
    // Remove trade requests for this specific image
    await TradeRequest.deleteMany({ card: cardId, imageIndex });
    // Decrement imageIndex for trade requests pointing to higher indices
    await TradeRequest.updateMany(
      { card: cardId, imageIndex: { $gt: imageIndex } },
      { $inc: { imageIndex: -1 } }
    );
    // Remove the image from the array
    existing.images.splice(imageIndex, 1);
    await existing.save();
    revalidatePath("/oc-cards");
    return { deleted: false };
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