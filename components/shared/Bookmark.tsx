import React, { useEffect, useState } from 'react'
import { IEvent } from '@/lib/database/models/event.model'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { StickyNote } from 'lucide-react'
import { updateOrderNote, createOrder, deleteOrder, findOrder } from '@/lib/actions/order.actions'

const Bookmark = ({
  event,
  userId,
  hasOrdered,
  imageIndex
}: {
  event: IEvent,
  userId: string,
  hasOrdered?: boolean,
  imageIndex?: number
}) => {
  const [isBookmarked, setIsBookmarked] = useState(hasOrdered);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    const loadExisting = async () => {
      if (hasOrdered) {
        setLoadingOrder(true);
        const existing = await findOrder({ eventId: event._id, userId, imageIndex });
        if (existing) {
          setOrderId(existing._id);
          setNote(existing.note || '');
          setIsBookmarked(true);
        } else {
          setIsBookmarked(false);
        }
        setLoadingOrder(false);
      } else {
        setIsBookmarked(false);
      }
    };
    loadExisting();
  }, [hasOrdered, event._id, userId, imageIndex]);

  const handleSave = async () => {
    if (orderId) {
      await updateOrderNote(orderId, note.trim());
    } else {
      const created = await createOrder({ eventId: event._id, buyerId: userId, imageIndex, note: note.trim() });
      if (created?._id) setOrderId(created._id);
      setIsBookmarked(true);
    }
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      let idToDelete = orderId;
      if (!idToDelete) {
        const existing = await findOrder({ eventId: event._id, userId, imageIndex });
        idToDelete = existing?._id;
      }
      if (idToDelete) {
        await deleteOrder({ orderId: idToDelete });
      }
      setIsBookmarked(false);
      setOrderId(null);
      setNote('');
    } catch (e) {
      console.error('Failed to delete bookmark', e);
    }
  };

  const openAddDialog = () => {
    setNote('');
    setOpen(true);
  };

  const openEditDialog = () => {
    setOpen(true);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Primary action button */}
      {!isBookmarked && (
        <Button onClick={openAddDialog} size="default" className="button sm:w-fit text-sm" disabled={loadingOrder}>
          Lưu
        </Button>
      )}
      {isBookmarked && (
        <Button onClick={handleDelete} size="default" className="button sm:w-fit text-sm" variant="destructive" disabled={loadingOrder}>
          Xóa
        </Button>
      )}

      {/* Note icon (only if note exists) */}
      {isBookmarked && orderId && note.trim() && (
        <Button type="button" variant="outline" size="icon" onClick={openEditDialog} title="Xem / sửa ghi chú">
          <StickyNote className="w-4 h-4" />
        </Button>
      )}

      {/* Dialog for adding/editing note */}
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Ghi chú</DialogTitle>
            </DialogHeader>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú cho sample này (bỏ trống nếu không cần)"
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="button" onClick={handleSave}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

export default Bookmark
