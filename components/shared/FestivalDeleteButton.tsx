'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/alert-dialog'
import { deleteFestival } from '@/lib/actions/festival.actions'

export default function FestivalDeleteButton({
  festivalId,
  festivalName,
}: {
  festivalId: string
  festivalName: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">Xóa</Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa festival &quot;{festivalName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription className="text-grey-600 dark:text-muted-foreground">
            Hành động này không thể hoàn tác. Festival sẽ bị xóa vĩnh viễn.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Quay lại</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                await deleteFestival(festivalId)
                router.refresh()
              })
            }
          >
            {isPending ? 'Đang xóa...' : 'Xóa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
