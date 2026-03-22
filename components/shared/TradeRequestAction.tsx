"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateTradeRequestStatus } from "@/lib/actions/tradeRequest.actions";
import { Check, X } from "lucide-react";

type Props = {
  requestId: string;
  userId: string;
  status: "pending" | "accepted" | "declined";
};

export default function TradeRequestAction({ requestId, userId, status: initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus: "accepted" | "declined") => {
    setLoading(true);
    try {
      await updateTradeRequestStatus({ userId, requestId, status: newStatus });
      setStatus(newStatus);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  if (status === "accepted") {
    return <Badge className="bg-green-500 text-white">Đã chấp nhận</Badge>;
  }

  if (status === "declined") {
    return <Badge variant="secondary">Đã từ chối</Badge>;
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        className="text-green-600 border-green-300 hover:bg-green-50"
        onClick={() => handleAction("accepted")}
        disabled={loading}
      >
        <Check className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-300 hover:bg-red-50"
        onClick={() => handleAction("declined")}
        disabled={loading}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
