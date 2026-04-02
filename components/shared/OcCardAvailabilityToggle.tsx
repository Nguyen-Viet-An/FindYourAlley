"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleOcCardAvailability } from "@/lib/actions/ocCard.actions";
import { useTranslations } from 'next-intl';

type Props = {
  cardId: string;
  userId: string;
  initialAvailable: boolean;
};

export default function OcCardAvailabilityToggle({ cardId, userId, initialAvailable }: Props) {
  const t = useTranslations('ocCard');
  const [available, setAvailable] = useState(initialAvailable);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const updated = await toggleOcCardAvailability({ userId, cardId });
      if (updated) setAvailable(updated.available);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleToggle}
      disabled={loading}
      className="text-xs"
    >
      {available ? t('markUnavailable') : t('markAvailable')}
    </Button>
  );
}