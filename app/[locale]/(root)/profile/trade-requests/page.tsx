import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTradeRequestsForUser, getMyTradeRequests } from "@/lib/actions/tradeRequest.actions";
import TradeRequestAction from "@/components/shared/TradeRequestAction";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from 'next-intl/server';

export default async function TradeRequestsPage() {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  if (!userId) redirect("/sign-in");

  const [incomingRequests, outgoingRequests] = await Promise.all([
    getTradeRequestsForUser(userId),
    getMyTradeRequests(userId),
  ]);
  const t = await getTranslations('tradeManage');

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-between">
          <h3 className="h3-bold">{t('title')}</h3>
          <Link href="/profile" className="text-sm text-primary-500 hover:underline">
            {t('backToProfile')}
          </Link>
        </div>
      </section>

      <section className="wrapper my-8 flex flex-col gap-8">
        {/* Incoming Requests (other people want your cards) */}
        <div>
          <h4 className="text-lg font-bold mb-4">{t('incomingTitle', { count: incomingRequests.length })}</h4>
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noIncoming')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {incomingRequests.map((req: any) => {
                const requesterName = req.requester
                  ? `${req.requester.firstName || ""} ${req.requester.lastName || ""}`.trim()
                  : "Unknown";
                const cardImage = req.card?.images?.[req.imageIndex ?? 0];
                const ocName = cardImage?.ocName || req.card?.ownerName || "OC Card";

                return (
                  <div key={req._id} className="flex gap-3 p-3 border rounded-lg bg-white dark:bg-card">
                    {/* Card thumbnail */}
                    {cardImage?.imageUrl && (
                      <Link href={`/oc-cards/${req.card._id}`} className="shrink-0">
                        <Image
                          src={cardImage.imageUrl}
                          alt={ocName}
                          width={60}
                          height={80}
                          className="rounded-md object-cover w-[60px] h-[80px]"
                          unoptimized
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{ocName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('from', { name: requesterName })}
                          </p>
                        </div>
                        <TradeRequestAction requestId={req._id} userId={userId} status={req.status} />
                      </div>
                      {req.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.message}</p>
                      )}
                      {req.contactMethod && (
                        <p className="text-xs text-muted-foreground mt-1">{t('contact')} <span className="font-medium text-foreground">{req.contactMethod}</span></p>
                      )}
                      {req.linkedCard && (
                        <Link
                          href={`/oc-cards/${req.linkedCard._id}`}
                          className="flex items-center gap-2 mt-1.5 p-1.5 rounded-md bg-gray-50 dark:bg-gray-700 border hover:border-primary-500 transition-colors"
                        >
                          {req.linkedCard.images?.[0]?.imageUrl && (
                            <Image
                              src={req.linkedCard.images[0].imageUrl}
                              alt={req.linkedCard.images[0]?.ocName || req.linkedCard.ownerName}
                              width={36}
                              height={48}
                              className="rounded object-cover w-[36px] h-[48px] shrink-0"
                              unoptimized
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {req.linkedCard.images?.[0]?.ocName || req.linkedCard.ownerName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{t('proposedCard')}</p>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outgoing Requests (your requests to other people's cards) */}
        <div>
          <h4 className="text-lg font-bold mb-4">{t('outgoingTitle', { count: outgoingRequests.length })}</h4>
          {outgoingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noOutgoing')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {outgoingRequests.map((req: any) => {
                const cardImage = req.card?.images?.[req.imageIndex ?? 0];
                const ocName = cardImage?.ocName || req.card?.ownerName || "OC Card";

                const statusBadge = req.status === "accepted" ? (
                  <Badge className="bg-green-500 text-white text-xs">{t('accepted')}</Badge>
                ) : req.status === "declined" ? (
                  <Badge variant="secondary" className="text-xs">{t('rejected')}</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">{t('pending')}</Badge>
                );

                return (
                  <div key={req._id} className="flex gap-3 p-3 border rounded-lg bg-white dark:bg-card">
                    {/* Card thumbnail */}
                    {cardImage?.imageUrl && (
                      <Link href={`/oc-cards/${req.card._id}`} className="shrink-0">
                        <Image
                          src={cardImage.imageUrl}
                          alt={ocName}
                          width={60}
                          height={80}
                          className="rounded-md object-cover w-[60px] h-[80px]"
                          unoptimized
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{ocName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('cardOwner', { name: req.card?.ownerName || "Unknown" })}
                          </p>
                        </div>
                        {statusBadge}
                      </div>
                      {req.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.message}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}