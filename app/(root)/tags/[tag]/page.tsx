import { getEventsByTag } from "@/lib/actions/event.actions";
import Collection from "@/components/shared/Collection";

export const revalidate = 60;

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag); // 👈 decode here

  const events = await getEventsByTag(decodedTag);

  return (
    <section className="wrapper my-8">
      <h2 className="h2-bold mb-4">Tag: {decodedTag}</h2>
      <Collection
        data={events}
        emptyTitle="Không tìm thấy sample nào"
        emptyStateSubtext="Hãy trở lại sau"
        collectionType="All_Events"
        limit={10}
        page={1}
        totalPages={1}
      />
    </section>
  );
}
