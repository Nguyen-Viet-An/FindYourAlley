import Link from "next/link";
import { getAllExtraTags } from "@/lib/actions/event.actions";

export default async function TagsPage() {
  const tags = await getAllExtraTags(); // returns ["sticker", "poster", "doujin", ...]

  return (
    <section className="wrapper my-8">
      <h2 className="h2-bold mb-4">Tất cả Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string) => (
          <Link 
            key={tag} 
            href={`/tags/${encodeURIComponent(tag)}`} 
            className="px-3 py-1 bg-primary-100 rounded-full bg-primary-500 hover:bg-primary-400"
          >
            {tag}
          </Link>
        ))}
      </div>
    </section>
  )
}