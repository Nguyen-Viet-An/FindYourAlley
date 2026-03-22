"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShareButton({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = title ? `${title} - FindYourAlley` : "FindYourAlley";

    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url });
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Đã copy link!" : "Chia sẻ"}
    </Button>
  );
}
