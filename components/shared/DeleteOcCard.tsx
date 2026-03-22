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
import { deleteOcCard } from "@/lib/actions/ocCard.actions";
import { Trash2 } from "lucide-react";

export default function DeleteOcCard({ cardId, userId }: { cardId: string; userId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Trash2 className="w-4 h-4 mr-1" /> Xóa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc muốn xóa OC card?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này sẽ xóa OC card vĩnh viễn, bao gồm các yêu cầu đổi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Quay lại</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                await deleteOcCard({ userId, cardId });
                router.push("/oc-cards");
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
