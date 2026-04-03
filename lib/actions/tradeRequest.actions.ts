"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/database";
import TradeRequest from "@/lib/database/models/tradeRequest.model";
import OcCard from "@/lib/database/models/ocCard.model";
import User from "@/lib/database/models/user.model";
import { handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const populateRequest = (query: any) =>
  query
    .populate({ path: "requester", model: User, select: "_id firstName lastName photo" })
    .populate({ path: "card", model: OcCard, select: "_id ownerName images owner contactMethod appearance" })
    .populate({ path: "linkedCard", model: OcCard, select: "_id ownerName images owner appearance contactMethod timePlace" });

// CREATE TRADE REQUEST ("Muốn đổi")
export async function createTradeRequest({
  userId,
  cardId,
  imageIndex,
  message,
  contactMethod,
  linkedCardId,
}: {
  userId: string;
  cardId: string;
  imageIndex?: number;
  message?: string;
  contactMethod?: string;
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

    // Check for reverse duplicate: the other person already requested the linked card
    if (linkedCardId) {
      const reverse = await TradeRequest.findOne({
        card: linkedCardId,
        linkedCard: cardId,
      });
      if (reverse) {
        if (reverse.status === "accepted") {
          return { error: "Yêu cầu đổi card này đã được chấp nhận từ phía đối phương." };
        } else if (reverse.status === "declined") {
          return { error: "Yêu cầu đổi card này đã bị từ chối từ phía đối phương." };
        }
        return { error: "Đối phương đã gửi yêu cầu đổi card này rồi. Hãy chấp nhận yêu cầu của họ thay vì tạo yêu cầu mới." };
      }
    }

    const req = await TradeRequest.create({
      card: cardId,
      requester: userId,
      imageIndex: imageIndex ?? 0,
      message: message || "",
      contactMethod: contactMethod || undefined,
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

// BATCH: Get trade counts for multiple card+imageIndex pairs in 2 aggregation queries
export async function batchGetTradeCounts(
  items: { cardId: string; imageIndex: number }[]
) {
  try {
    await connectToDatabase();
    if (items.length === 0) return [];

    const cardIds = [...new Set(items.map((i) => i.cardId))];
    const cardObjectIds = cardIds.map((id) => new mongoose.Types.ObjectId(id));

    // Total counts per card+imageIndex
    const totalAgg = await TradeRequest.aggregate([
      { $match: { card: { $in: cardObjectIds } } },
      { $group: { _id: { card: "$card", imageIndex: "$imageIndex" }, total: { $sum: 1 } } },
    ]);

    // Accepted counts per card+imageIndex
    const acceptedAgg = await TradeRequest.aggregate([
      { $match: { card: { $in: cardObjectIds }, status: "accepted" } },
      { $group: { _id: { card: "$card", imageIndex: "$imageIndex" }, accepted: { $sum: 1 } } },
    ]);

    const totalMap = new Map<string, number>();
    for (const r of totalAgg) {
      totalMap.set(`${r._id.card}-${r._id.imageIndex ?? 0}`, r.total);
    }
    const acceptedMap = new Map<string, number>();
    for (const r of acceptedAgg) {
      acceptedMap.set(`${r._id.card}-${r._id.imageIndex ?? 0}`, r.accepted);
    }

    return items.map((item) => {
      const key = `${item.cardId}-${item.imageIndex}`;
      return { total: totalMap.get(key) || 0, accepted: acceptedMap.get(key) || 0 };
    });
  } catch (error) {
    handleError(error);
    return items.map(() => ({ total: 0, accepted: 0 }));
  }
}

// BATCH: Check if user has requested multiple cards in a single query
export async function batchHasUserRequestedCards(
  userId: string,
  items: { cardId: string; imageIndex: number }[]
) {
  try {
    await connectToDatabase();
    if (!userId || items.length === 0) return items.map(() => null);

    const cardIds = [...new Set(items.map((i) => i.cardId))];
    const cardObjectIds = cardIds.map((id) => new mongoose.Types.ObjectId(id));

    const requests = await TradeRequest.find({
      card: { $in: cardObjectIds },
      requester: userId,
    }).lean();

    const reqMap = new Map<string, any>();
    for (const r of requests) {
      reqMap.set(`${r.card}-${r.imageIndex ?? 0}`, r);
    }

    return items.map((item) => {
      const found = reqMap.get(`${item.cardId}-${item.imageIndex}`);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    });
  } catch (error) {
    handleError(error);
    return items.map(() => null);
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

// GET DEFAULT CONTACT METHOD FOR PREFILL
// Priority: 1) contactMethod from user's OC cards, 2) user's email
export async function getDefaultContact(userId: string) {
  try {
    await connectToDatabase();
    // Check if user has OC cards with contactMethod
    const cardWithContact = await OcCard.findOne(
      { owner: userId, contactMethod: { $nin: [null, ""] } },
      { contactMethod: 1 }
    ).sort({ createdAt: -1 });
    if (cardWithContact?.contactMethod) return cardWithContact.contactMethod;

    // Fallback to user email
    const user = await User.findById(userId, { email: 1 });
    return user?.email || "";
  } catch (error) {
    handleError(error);
    return "";
  }
}