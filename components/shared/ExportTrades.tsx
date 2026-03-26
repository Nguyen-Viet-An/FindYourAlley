"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type TradeExportItem = {
  cardOcName: string;
  cardOwner: string;
  offeredOcName: string;
  contactMethod: string;
  requesterContact: string;
  appearance: string;
  requesterName: string;
};

function flattenTrades(
  asRequester: any[],
  asOwner: any[],
): TradeExportItem[] {
  const items: TradeExportItem[] = [];

  // Cards user requested & got accepted → they received trade.card
  asRequester.forEach((t: any) => {
    const img = t.card?.images?.[t.imageIndex ?? 0];
    const linkedImg = t.linkedCard?.images?.[0];
    items.push({
      cardOcName: img?.ocName || "—",
      cardOwner: t.card?.ownerName || "—",
      offeredOcName: linkedImg?.ocName || "—",
      contactMethod: t.card?.contactMethod || t.linkedCard?.contactMethod || "",
      requesterContact: "",
      appearance: "",
      requesterName: "",
    });
  });

  // Cards offered to user (as owner) → they received trade.linkedCard
  asOwner.forEach((t: any) => {
    const linkedImg = t.linkedCard?.images?.[0];
    const reqName = t.requester
      ? `${t.requester.firstName || ""} ${t.requester.lastName || ""}`.trim()
      : "—";
    items.push({
      cardOcName: linkedImg?.ocName || "—",
      cardOwner: t.linkedCard?.ownerName || "—",
      offeredOcName: t.card?.images?.[t.imageIndex ?? 0]?.ocName || "—",
      contactMethod: t.linkedCard?.contactMethod || "",
      requesterContact: t.contactMethod || "",
      appearance: t.linkedCard?.appearance?.text || "",
      requesterName: reqName,
    });
  });

  return items;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtmlContent(items: TradeExportItem[]) {
  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${escapeHtml(item.cardOcName)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${escapeHtml(item.cardOwner)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${escapeHtml(item.offeredOcName)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${escapeHtml(item.contactMethod || item.requesterContact || "")}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${escapeHtml(item.appearance)}</td>
      </tr>`
    )
    .join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>FindYourAlley - Card đã đổi</title></head>
    <body style="font-family:Arial,sans-serif">
      <h2 style="color:#D87A6B">FindYourAlley - Card đã đổi được</h2>
      <p>Xuất lúc: ${escapeHtml(new Date().toLocaleString("vi-VN"))} &bull; Tổng: ${items.length} card</p>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#D87A6B;color:white">
            <th style="padding:8px 10px;border:1px solid #ddd">STT</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Tên OC nhận</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Chủ card</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Tên OC đã đổi</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Liên hệ</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Nhận dạng</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
}

export default function ExportTrades({
  asRequester,
  asOwner,
}: {
  asRequester: any[];
  asOwner: any[];
}) {
  const items = flattenTrades(asRequester, asOwner);

  const exportAsText = () => {
    const lines = [
      "=== FindYourAlley - Card đã đổi được ===",
      `Xuất lúc: ${new Date().toLocaleString("vi-VN")}`,
      `Tổng: ${items.length} card`,
      "",
      ...items.map((item, i) => {
        const parts = [`${i + 1}. ${item.cardOcName} (chủ: ${item.cardOwner})`];
        parts.push(`   Đổi bằng: ${item.offeredOcName}`);
        const contact = item.contactMethod || item.requesterContact;
        if (contact) parts.push(`   📞 Liên hệ: ${contact}`);
        if (item.appearance) parts.push(`   👤 Nhận dạng: ${item.appearance}`);
        return parts.join("\n");
      }),
    ];
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `findyouralley-trades-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsWord = () => {
    const html = buildHtmlContent(items);
    const blob = new Blob(["\uFEFF" + html], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `findyouralley-trades-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const html = buildHtmlContent(items);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 400);
  };

  if (!items.length) return null;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportAsText} className="gap-2">
        <Download className="h-4 w-4" /> .txt
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsWord} className="gap-2">
        <Download className="h-4 w-4" /> .doc
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsPdf} className="gap-2">
        <Download className="h-4 w-4" /> PDF
      </Button>
    </div>
  );
}