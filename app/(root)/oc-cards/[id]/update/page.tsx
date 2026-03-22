import OcCardForm from "@/components/shared/OcCardForm";
import { auth } from "@clerk/nextjs/server";
import { getOcCardById } from "@/lib/actions/ocCard.actions";
import { getFestivals } from "@/lib/actions/festival.actions";

type UpdateOcCardProps = {
  params: Promise<{ id: string }>;
};

export default async function UpdateOcCard(props: UpdateOcCardProps) {
  const params = await props.params;
  const { id } = params;
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  const [card, festivals] = await Promise.all([
    getOcCardById(id),
    getFestivals(),
  ]);

  return (
    <>
      <section className="bg-primary-50 dark:bg-muted bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Cập nhật OC Card</h3>
      </section>
      <div className="wrapper my-8">
        <OcCardForm type="Update" userId={userId} card={card} cardId={card._id} festivals={festivals || []} />
      </div>
    </>
  );
}
