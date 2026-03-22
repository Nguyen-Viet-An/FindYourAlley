"use server";

import { connectToDatabase } from "@/lib/database";
import TradeRequest from "@/lib/database/models/tradeRequest.model"
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
  message,
  linkedCardId,
}: {
  userId: string;
  cardId: string;
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
export async function getTradeRequestsForCard(cardId: string) {
  try {
    await connectToDatabase();
    const requests = await populateRequest(
      TradeRequest.find({ card: cardId }).sort({ createdAt: -1 })
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

// GET TRADE COUNT FOR A CARD
export async function getTradeCountForCard(cardId: string) {
  try {
    await connectToDatabase();
    const total = await TradeRequest.countDocuments({ card: cardId });
    const accepted = await TradeRequest.countDocuments({ card: cardId, status: "accepted" });
    return { total, accepted };
  } catch (error) {
    handleError(error);
    return { total: 0, accepted: 0 };
  }
}

// CHECK IF USER ALREADY REQUESTED A CARD
export async function hasUserRequestedCard(userId: string, cardId: string) {
  try {
    await connectToDatabase();
    const existing = await TradeRequest.findOne({ card: cardId, requester: userId });
    return existing ? JSON.parse(JSON.stringify(existing)) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}
