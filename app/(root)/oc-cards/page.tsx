import { getAllOcCards } from "@/lib/actions/ocCard.actions";
import { getTradeCountForCard, hasUserRequestedCard } from "@/lib/actions/tradeRequest.actions";
import { getFestivals } from "@/lib/actions/festival.actions";
import OcCardItem from "@/components/shared/OcCardItem";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Search from "@/components/shared/Search";
import OcCardSortSelect from "@/components/shared/OcCardSortSelect";
import FestivalFilter from "@/components/shared/FestivalFilter";
import { auth } from "@clerk/nextjs/server";

type OcCardsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OcCardsPage({ searchParams }: OcCardsPageProps) {
  const params = await searchParams;
  const query = (params?.query as string) || "";
  const sortBy = (params?.sortBy as string) || "newest";
  const festivalId = (params?.festivalId as string) || undefined;

  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  const [cards, festivals] = await Promise.all([
    getAllOcCards({ query, sortBy, festivalId }),
    getFestivals(),
  ]);

  // Flatten cards into per-image items (filter out invalid cards)
  const flatItems: { card: any; imageIndex: number; cardIndex: number }[] = [];
  cards.filter(Boolean).forEach((card: any, ci: number) => {
    if (card.images && card.images.length > 0) {
      card.images.forEach((_: any, ii: number) => {
        flatItems.push({ card, imageIndex: ii, cardIndex: ci });
      });
    } else {
      flatItems.push({ card, imageIndex: 0, cardIndex: ci });
    }
  });

  // Fetch per-image trade counts and request status
  const flatExtras = await Promise.all(
    flatItems.map(async (item) => {
      const [tradeCount, requested] = await Promise.all([
        getTradeCountForCard(item.card._id, item.imageIndex),
        userId ? hasUserRequestedCard(userId, item.card._id, item.imageIndex) : Promise.resolve(null),
      ]);
      return {
        tradeCount,
        isOwner: userId === item.card.owner?._id?.toString(),
        alreadyRequested: !!requested,
        requestStatus: requested?.status || null,
      };
    })
  );

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-between">
          <h3 className="h3-bold">OC Trading Cards</h3>
          <Button asChild className="bg-primary-500 hover:bg-primary-400 text-white">
            <Link href="/oc-cards/create">Đăng OC Card</Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8 flex flex-col gap-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Search placeholder="Tìm theo tên OC, chủ card, artist..." />
          </div>
          <div className="w-40">
            <FestivalFilter festivals={festivals || []} />
          </div>
          <OcCardSortSelect />
        </div>

        {flatItems.length === 0 ? (
          <div className="flex-center min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 dark:bg-muted py-28 text-center">
            <h3 className="p-bold-20 md:h5-bold">Chưa có OC card nào</h3>
            <p className="p-regular-14">Hãy là người đầu tiên đăng OC card!</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {flatItems.map((item, index) => (
              <div key={`${item.card._id}-${item.imageIndex}`} className="break-inside-avoid">
                <OcCardItem
                  card={item.card}
                  imageIndex={item.imageIndex}
                  tradeCount={flatExtras[index].tradeCount}
                  userId={userId}
                  isOwner={flatExtras[index].isOwner}
                  alreadyRequested={flatExtras[index].alreadyRequested}
                  requestStatus={flatExtras[index].requestStatus}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
