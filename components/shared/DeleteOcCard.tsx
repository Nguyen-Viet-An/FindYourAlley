"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteOcCard, deleteOcCardImage } from "@/lib/actions/ocCard.actions";
import { Trash2 } from "lucide-react";

type DeleteOcCardProps = {
  cardId: string;
  userId: string;
  iconOnly?: boolean;
  imageIndex?: number;
  totalImages?: number;
};

export default function DeleteOcCard({ cardId, userId, iconOnly, imageIndex, totalImages }: DeleteOcCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('deleteConfirm');
  const tc = useTranslations('common');

  const isMultiImage = totalImages != null && totalImages > 1 && imageIndex != null;
  const description = isMultiImage
    ? t('ocImageMessage')
    : t('ocCardMessage');
  const title = isMultiImage
    ? t('ocImageTitle')
    : t('ocCardTitle');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <button className="bg-white dark:bg-card rounded-md p-1.5 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <Button size="sm" variant="destructive">
            <Trash2 className="w-4 h-4 mr-1" /> {tc('delete')}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('back')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                if (isMultiImage) {
                  const result = await deleteOcCardImage({ userId, cardId, imageIndex });
                  if (result?.deleted) {
                    router.push("/oc-cards");
                  } else {
                    router.refresh();
                  }
                } else {
                  await deleteOcCard({ userId, cardId });
                  router.push("/oc-cards");
                }
              })
            }
          >
            {isPending ? tc('deleting') : tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}