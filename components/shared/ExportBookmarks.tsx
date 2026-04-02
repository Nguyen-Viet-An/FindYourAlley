"use client";

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type BookmarkExport = {
  title: string;
  artists: string;
  note: string;
  hasPreorder: string;
};

function buildHtmlContent(bookmarks: BookmarkExport[]) {
  const rows = bookmarks
    .map(
      (b, i) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${b.title}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${b.artists || ""}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${b.hasPreorder === "Yes" ? "Có" : ""}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${b.note || ""}</td>
      </tr>`
    )
    .join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>FindYourAlley Bookmarks</title></head>
    <body style="font-family:Arial,sans-serif">
      <h2 style="color:#D87A6B">FindYourAlley - Danh sách bookmark</h2>
      <p>Xuất lúc: ${new Date().toLocaleString("vi-VN")} &bull; Tổng: ${bookmarks.length} sample</p>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#D87A6B;color:white">
            <th style="padding:8px 10px;border:1px solid #ddd">STT</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Gian hàng</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Artists</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Preorder</th>
            <th style="padding:8px 10px;border:1px solid #ddd">Ghi chú</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
}

export default function ExportBookmarks({ bookmarks }: { bookmarks: BookmarkExport[] }) {
  const t = useTranslations('export');
  const exportAsText = () => {
    const lines = [
      "=== FindYourAlley - Danh sách bookmark ===",
      `Xuất lúc: ${new Date().toLocaleString("vi-VN")}`,
      `Tổng: ${bookmarks.length} sample`,
      "",
      ...bookmarks.map((b, i) => {
        const parts = [`${i + 1}. ${b.title}`];
        if (b.artists) parts.push(`   Artists: ${b.artists}`);
        if (b.hasPreorder === "Yes") parts.push("   📦 Có preorder");
        if (b.note) parts.push(`   📝 ${b.note}`);
        return parts.join("\n");
      }),
    ];
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `findyouralley-bookmarks-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsWord = () => {
    const html = buildHtmlContent(bookmarks);
    const blob = new Blob(["\uFEFF" + html], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `findyouralley-bookmarks-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const html = buildHtmlContent(bookmarks);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    // Small delay to let content render, then trigger print dialog (user picks "Save as PDF")
    setTimeout(() => {
      win.print();
    }, 400);
  };

  if (!bookmarks.length) return null;

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