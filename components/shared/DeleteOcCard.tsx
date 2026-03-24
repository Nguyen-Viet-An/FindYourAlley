"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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

  const isMultiImage = totalImages != null && totalImages > 1 && imageIndex != null;
  const description = isMultiImage
    ? "Hành động này sẽ xóa hình này khỏi OC card, bao gồm các yêu cầu đổi liên quan."
    : "Hành động này sẽ xóa OC card vĩnh viễn, bao gồm các yêu cầu đổi.";
  const title = isMultiImage
    ? "Bạn có chắc muốn xóa hình này?"
    : "Bạn có chắc muốn xóa OC card?";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <button className="bg-white dark:bg-card rounded-md p-1.5 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <Button size="sm" variant="destructive">
            <Trash2 className="w-4 h-4 mr-1" /> Xóa
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Quay lại</AlertDialogCancel>
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
            {isPending ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}