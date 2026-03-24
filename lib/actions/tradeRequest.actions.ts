"use server";

import { connectToDatabase } from "@/lib/database";
import TradeRequest from "@/lib/database/models/tradeRequest.model";
import OcCard from "@/lib/database/models/ocCard.model";
import User from "@/lib/database/models/user.model";
import { handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const populateRequest = (query: any) =>
  query
    .populate({ path: "requester", model: User, select: "_id firstName lastName photo" })
    .populate({ path: "card", model: OcCard, select: "_id ownerName images owner" })
    .populate({ path: "linkedCard", model: OcCard, select: "_id ownerName images owner appearance contactMethod timePlace" });

// CREATE TRADE REQUEST ("Muốn đổi")
export async function createTradeRequest({
  userId,
  cardId,
  imageIndex,
  message,
  linkedCardId,
}: {
  userId: string;
  cardId: string;
  imageIndex?: number;
  message?: string;
  linkedCardId?: string;
}) {
  try {
    await connectToDatabase();

    // Prevent requesting own card
    const card = await OcCard.findById(cardId);
    if (!card) throw new Error("Card not found");
    if (card.owner.toString() === userId) {
      throw new Error("Không thể đổi card của chính mình");
    }

    const req = await TradeRequest.create({
      card: cardId,
      requester: userId,
      imageIndex: imageIndex ?? 0,
      message: message || "",
      linkedCard: linkedCardId || undefined,
      status: "pending",
    });

    revalidatePath(`/oc-cards`);
    return JSON.parse(JSON.stringify(req));
  } catch (error: any) {
    // Handle duplicate key (already requested)
    if (error?.code === 11000) {
      return { error: "Bạn đã gửi yêu cầu đổi card này rồi." };
    }
    handleError(error);
  }
}

// GET TRADE REQUESTS FOR A CARD (card owner sees these)
export async function getTradeRequestsForCard(cardId: string, imageIndex?: number) {
  try {
    await connectToDatabase();
    const filter: any = { card: cardId };
    if (imageIndex !== undefined) filter.imageIndex = imageIndex;
    const requests = await populateRequest(
      TradeRequest.find(filter).sort({ createdAt: -1 })
    );
    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET ALL TRADE REQUESTS FOR A USER'S CARDS (owner dashboard)
export async function getTradeRequestsForUser(userId: string) {
  try {
    await connectToDatabase();
    const userCards = await OcCard.find({ owner: userId }).select("_id");
    const cardIds = userCards.map((c: any) => c._id);
    if (!cardIds.length) return [];

    const requests = await populateRequest(
      TradeRequest.find({ card: { $in: cardIds } }).sort({ createdAt: -1 })
    );
    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET REQUESTS MADE BY A USER (requester view)
export async function getMyTradeRequests(userId: string) {
  try {
    await connectToDatabase();
    const requests = await populateRequest(
      TradeRequest.find({ requester: userId }).sort({ createdAt: -1 })
    );
    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// ACCEPT / DECLINE
export async function updateTradeRequestStatus({
  userId,
  requestId,
  status,
}: {
  userId: string;
  requestId: string;
  status: "accepted" | "declined";
}) {
  try {
    await connectToDatabase();
    const req = await TradeRequest.findById(requestId).populate("card");
    if (!req) throw new Error("Request not found");

    // Only the card owner can accept/decline
    if (req.card.owner.toString() !== userId) {
      throw new Error("Unauthorized");
    }

    req.status = status;
    await req.save();
    revalidatePath("/oc-cards");
    return JSON.parse(JSON.stringify(req));
  } catch (error) {
    handleError(error);
  }
}

// GET TRADE COUNT FOR A CARD (per image)
export async function getTradeCountForCard(cardId: string, imageIndex?: number) {
  try {
    await connectToDatabase();
    const filter: any = { card: cardId };
    if (imageIndex !== undefined) filter.imageIndex = imageIndex;
    const total = await TradeRequest.countDocuments(filter);
    const accepted = await TradeRequest.countDocuments({ ...filter, status: "accepted" });
    return { total, accepted };
  } catch (error) {
    handleError(error);
    return { total: 0, accepted: 0 };
  }
}

// CHECK IF USER ALREADY REQUESTED A CARD (per image)
export async function hasUserRequestedCard(userId: string, cardId: string, imageIndex?: number) {
  try {
    await connectToDatabase();
    const filter: any = { card: cardId, requester: userId };
    if (imageIndex !== undefined) filter.imageIndex = imageIndex;
    const existing = await TradeRequest.findOne(filter);
    return existing ? JSON.parse(JSON.stringify(existing)) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

// GET ACCEPTED TRADES FOR A USER (cards they successfully got)
// - As requester: the card they requested (trade.card)
// - As owner: the linked card offered to them (trade.linkedCard)
export async function getAcceptedTradesForUser(userId: string) {
  try {
    await connectToDatabase();

    // Cards the user requested and got accepted
    const asRequester = await populateRequest(
      TradeRequest.find({ requester: userId, status: "accepted" }).sort({ createdAt: -1 })
    );

    // Cards offered to the user (as card owner) via linkedCard
    const userCards = await OcCard.find({ owner: userId }).select("_id");
    const cardIds = userCards.map((c: any) => c._id);
    const asOwner = cardIds.length
      ? await populateRequest(
          TradeRequest.find({
            card: { $in: cardIds },
            status: "accepted",
            linkedCard: { $ne: null },
          }).sort({ createdAt: -1 })
        )
      : [];

    return {
      asRequester: JSON.parse(JSON.stringify(asRequester)),
      asOwner: JSON.parse(JSON.stringify(asOwner)),
    };
  } catch (error) {
    handleError(error);
    return { asRequester: [], asOwner: [] };
  }
}