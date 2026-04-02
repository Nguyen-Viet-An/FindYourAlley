'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('deleteConfirm')
  const tc = useTranslations('common')

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">{tc('delete')}</Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('festivalTitle', { name: festivalName })}</AlertDialogTitle>
          <AlertDialogDescription className="text-grey-600 dark:text-muted-foreground">
            {t('festivalMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{tc('back')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                await deleteFestival(festivalId)
                router.refresh()
              })
            }
          >
            {isPending ? tc('deleting') : tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}