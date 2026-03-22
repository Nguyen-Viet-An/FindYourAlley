import { getOcCardById } from "@/lib/actions/ocCard.actions";
import { getTradeRequestsForCard, hasUserRequestedCard, getTradeCountForCard } from "@/lib/actions/tradeRequest.actions";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, User } from "lucide-react";
import TradeRequestButton from "@/components/shared/TradeRequestButton";
import OcCardAvailabilityToggle from "@/components/shared/OcCardAvailabilityToggle";
import DeleteOcCard from "@/components/shared/DeleteOcCard";
import OcCardImageGallery from "@/components/shared/OcCardImageGallery";
import CardLightbox from "@/components/shared/CardLightbox";

type OcCardDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function OcCardDetail(props: OcCardDetailProps) {
  const params = await props.params;
  const card = await getOcCardById(params.id);
  if (!card) {
    return (
      <div className="wrapper my-8 text-center">
        <h2 className="h2-bold">Không tìm thấy OC card</h2>
      </div>
    );
  }

  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  const isOwner = userId === card.owner?._id?.toString();
  const tradeCount = await getTradeCountForCard(card._id);
  const alreadyRequested = userId ? !!(await hasUserRequestedCard(userId, card._id)) : false;

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper">
          <h3 className="h3-bold">OC Card - {card.images?.[0]?.ocName || card.ownerName}</h3>
        </div>
      </section>

      <section className="wrapper my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div>
            <OcCardImageGallery image={card.images?.[0]} ownerName={card.ownerName} />
          </div>

          {/* Right: Info */}
          <div className="flex flex-col gap-4">
            {/* OC name + owner + actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="h2-bold">{card.images?.[0]?.ocName || 'OC Card'}</h2>
                <p className="text-muted-foreground">OC thuộc về {card.ownerName}</p>
                {card.images?.[0]?.artistName && (
                  <p className="text-sm text-muted-foreground">🎨 Artist thực hiện: {card.images[0].artistName}</p>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/oc-cards/${card._id}/update`}>
                      <Pencil className="w-4 h-4 mr-1" /> Sửa
                    </Link>
                  </Button>
                  <DeleteOcCard cardId={card._id} userId={userId} />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex gap-2 items-center flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                card.available
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {card.available ? "Còn đổi" : "Hết card"}
              </span>
              {card.festival?.map((f: any) => (
                <Badge key={f._id} variant="outline">
                  {f.code || f.name}
                </Badge>
              ))}
              <span className="text-sm text-muted-foreground">{tradeCount.total} người muốn đổi</span>
              {isOwner && (
                <OcCardAvailabilityToggle cardId={card._id} userId={userId} initialAvailable={card.available} />
              )}
            </div>

            {/* Time & Location */}
            {(card.eventTime || card.location) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
                <p>
                  {card.eventTime}
                  {card.eventTime && card.location && " \u2022 "}
                  {card.location}
                </p>
              </div>
            )}

            {/* Appearance */}
            {(card.appearance?.text || card.appearance?.imageUrl) && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Đặc điểm nhận dạng
                </h3>
                {card.appearance.text && <p className="mb-2">{card.appearance.text}</p>}
                {card.appearance.imageUrl && (
                  <CardLightbox imageUrl={card.appearance.imageUrl} alt="Ảnh nhận dạng" renderImage={false}>
                    <Image
                      src={card.appearance.imageUrl}
                      alt="Ảnh nhận dạng"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      unoptimized
                    />
                  </CardLightbox>
                )}
              </div>
            )}

            {/* Contact */}
            {card.contactMethod && (
              <div className="text-sm">
                <p className="font-semibold mb-1">Phương thức liên lạc</p>
                <p className="break-all text-muted-foreground">{card.contactMethod}</p>
              </div>
            )}

            {/* Trade request button (not for own cards) */}
            {!isOwner && userId && (
              <TradeRequestButton
                cardId={card._id}
                userId={userId}
                alreadyRequested={alreadyRequested}
                available={card.available}
              />
            )}

            {/* Owner: trade requests list */}
            {isOwner && (
              <TradeRequestsList cardId={card._id} userId={userId} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

async function TradeRequestsList({ cardId, userId }: { cardId: string; userId: string }) {
  const requests = await getTradeRequestsForCard(cardId);

  if (!requests || requests.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-sm text-muted-foreground">
        Chưa có ai muốn đổi card này.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Danh sách người muốn đổi card ({requests.length})</h3>
      <div className="flex flex-col gap-3">
        {requests.map((req: any) => (
          <TradeRequestItem key={req._id} request={req} userId={userId} />
        ))}
      </div>
    </div>
  );
}

import TradeRequestAction from "@/components/shared/TradeRequestAction";

function TradeRequestItem({ request, userId }: { request: any; userId: string }) {
  const requester = request.requester;
  const name = requester
    ? `${requester.firstName || ""} ${requester.lastName || ""}`.trim()
    : "Unknown";

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-md bg-grey-50 dark:bg-gray-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {requester?.photo && (
            <Image src={requester.photo} alt={name} width={32} height={32} className="rounded-full" />
          )}
          <span className="font-medium text-sm">{name}</span>
        </div>
        <TradeRequestAction requestId={request._id} userId={userId} status={request.status} />
      </div>
      {request.message && (
        <p className="text-sm text-muted-foreground">{request.message}</p>
      )}
      {request.linkedCard && (
        <Link
          href={`/oc-cards/${request.linkedCard._id}`}
          className="text-sm text-primary-500 hover:underline flex items-center gap-1"
        >
          🔗 Xem card của họ: {request.linkedCard.ownerName}
        </Link>
      )}
    </div>
  );
}
