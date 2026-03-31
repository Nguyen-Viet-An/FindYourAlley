import { BookOpen, PlusCircle, Pencil, Trash2, Search, Star, Tag, ImageIcon, Users, ArrowRight, HelpCircle, MapPin, Calendar } from "lucide-react";

export const metadata = {
  title: "Hướng dẫn sử dụng | FindYourAlley",
};

export default function GuidePage() {
  return (
    <div className="wrapper py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary-500" />
        Hướng dẫn sử dụng FindYourAlley
      </h1>
      <p className="text-muted-foreground mb-8">
        Trang web giúp khách tham quan tìm gian hàng tại các festival dễ dàng hơn. Chủ gian đăng thông tin, ảnh sample, còn khách có thể tìm, lọc, bookmark gian hàng yêu thích.
      </p>

      {/* Section: Giới thiệu */}
      <Section icon={<Star className="h-5 w-5 text-yellow-500" />} title="FindYourAlley là gì?">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Dành cho chủ gian hàng:</strong> Đăng ảnh sample, thông tin gian, fandom, loại mặt hàng, preorder, ưu đãi&hellip; để khách dễ tìm.</li>
          <li><strong>Dành cho khách:</strong> Tìm kiếm theo tên gian, fandom, loại mặt hàng. Bookmark gian yêu thích để xem lại.</li>
          <li><strong>OC Cards:</strong> Đăng thẻ OC để trao đổi (trade) tại festival. Gửi lời mời trade, chấp nhận/từ chối, xem danh sách trade.</li>
          <li><strong>Mặt hàng nổi bật:</strong> Mỗi gian có thể chọn 1 sản phẩm tâm đắc nhất để hiện ở trang &ldquo;Nổi bật&rdquo;.</li>
          <li><strong>Ưu đãi / Khuyến mãi:</strong> Gắn badge ưu đãi ngắn gọn hiện trên card, cùng mô tả chi tiết.</li>
        </ul>
      </Section>

      {/* Section: Đăng gian hàng */}
      <Section icon={<PlusCircle className="h-5 w-5 text-green-500" />} title="Đăng gian hàng (sample)">
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Đăng nhập → Menu <strong>&ldquo;Đăng bài&rdquo;</strong> → <strong>&ldquo;Đăng sample&rdquo;</strong>.</li>
          <li>Điền thông tin: tiêu đề, festival, mô tả, artist, ảnh sample, fandom tags, loại mặt hàng&hellip;</li>
          <li>Nếu có preorder, chọn <strong>Có</strong> và dán link.</li>
          <li>Nhấn <strong>&ldquo;Đăng sample&rdquo;</strong>.</li>
        </ol>
      </Section>

      {/* Section: Cách đặt tiêu đề */}
      <Section icon={<MapPin className="h-5 w-5 text-blue-500" />} title="Cách đặt tiêu đề gian hàng">
        <p className="text-sm mb-3">
          Tiêu đề nên có <strong>vị trí gian</strong> + <strong>tên gian</strong> để khách dễ tìm trên bản đồ.
        </p>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✅ Đúng:</p>
          <ul className="text-sm space-y-1 text-green-800 dark:text-green-300">
            <li><code className="bg-green-100 dark:bg-green-900 px-1 rounded">Q22 - Gà Rán</code></li>
            <li><code className="bg-green-100 dark:bg-green-900 px-1 rounded">B12 - Tiệm Mực</code></li>
          </ul>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">❌ Nên tránh:</p>
          <ul className="text-sm space-y-1 text-red-800 dark:text-red-300">
            <li><code className="bg-red-100 dark:bg-red-900 px-1 rounded">Gà Rán</code> — thiếu vị trí gian</li>
            <li><code className="bg-red-100 dark:bg-red-900 px-1 rounded">gian hàng của mình nè</code> — không có thông tin</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">📌 Gian hàng tham gia nhiều festival:</p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            Mỗi festival có cách đánh số gian khác nhau. Nếu gian hàng tham gia nhiều festival, hãy ghi rõ mã festival + số gian:
          </p>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-300">
            <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">B12 (COFI15) / 54 (ABC) - Tiệm Mực</code></li>
            <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">COFI15: B12 | ABC: 54 - Tiệm Mực</code></li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            💡 Hoặc bạn có thể tạo bài đăng riêng cho mỗi festival — tuỳ bạn!
          </p>
        </div>
      </Section>

      {/* Section: Chỉnh sửa / xoá gian hàng */}
      <Section icon={<Pencil className="h-5 w-5 text-orange-500" />} title="Chỉnh sửa / Xoá gian hàng">
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Chỉnh sửa:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Mở trang chi tiết gian hàng của bạn (nhấn vào card).</li>
              <li>Nhấn nút <span className="inline-flex items-center gap-1 bg-grey-50 dark:bg-muted px-2 py-0.5 rounded"><Pencil className="h-3 w-3" /> Sửa</span> ở góc trên.</li>
              <li>Chỉnh sửa thông tin → nhấn <strong>&ldquo;Cập nhật sample&rdquo;</strong>.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">Xoá:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Mở trang chi tiết gian hàng.</li>
              <li>Nhấn nút <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/30 text-red-600 px-2 py-0.5 rounded"><Trash2 className="h-3 w-3" /> Xoá</span>.</li>
              <li>Xác nhận xoá.</li>
            </ol>
          </div>
          <p className="text-muted-foreground">
            ⚠️ Bạn chỉ có thể sửa/xoá gian hàng do chính mình đăng. Nút sửa/xoá sẽ không hiện nếu bạn không phải chủ gian.
          </p>
        </div>
      </Section>

      {/* Section: OC Cards */}
      <Section icon={<Users className="h-5 w-5 text-purple-500" />} title="OC Cards & Trade">
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Đăng OC Card:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Menu <strong>&ldquo;Đăng bài&rdquo;</strong> → <strong>&ldquo;Đăng OC card&rdquo;</strong>.</li>
              <li>Điền tên chủ OC, ảnh OC, tên OC, festival, thông tin liên hệ, nhận dạng&hellip;</li>
              <li>Nhấn <strong>&ldquo;Đăng OC card&rdquo;</strong>.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">Gửi lời mời trade:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tìm OC card bạn muốn trade → nhấn nút <strong>&ldquo;Gửi lời mời trade&rdquo;</strong>.</li>
              <li>Chọn card của bạn để trade, điền phương thức liên hệ và tin nhắn.</li>
              <li>Chủ OC sẽ nhận được thông báo và có thể chấp nhận/từ chối.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">Chỉnh sửa / xoá OC Card:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Nhấn vào OC card của bạn → nhấn <span className="inline-flex items-center gap-1 bg-grey-50 dark:bg-muted px-2 py-0.5 rounded"><Pencil className="h-3 w-3" /></span> để sửa, hoặc nút xoá 🗑️ để xoá.</li>
              <li>Trong trang sửa, bạn có thể thay đổi ảnh, tên, mô tả, availability&hellip;</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Section: Tìm kiếm & lọc */}
      <Section icon={<Search className="h-5 w-5 text-cyan-500" />} title="Tìm kiếm & Lọc">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Thanh tìm kiếm:</strong> Gõ tên gian, vị trí, artist, fandom&hellip; để tìm nhanh.</li>
          <li><strong>Lọc fandom:</strong> Chọn một hoặc nhiều fandom trong bộ lọc.</li>
          <li><strong>Lọc loại mặt hàng:</strong> Acrylic, sticker, poster&hellip;</li>
          <li><strong>Lọc preorder:</strong> Chỉ hiện gian có mở preorder.</li>
          <li><strong>Lọc festival:</strong> Chuyển đổi giữa các festival đang diễn ra.</li>
          <li><strong>Sắp xếp:</strong> Theo mới nhất, bookmark nhiều nhất&hellip;</li>
        </ul>
      </Section>

      {/* Section: Bookmark */}
      <Section icon={<ImageIcon className="h-5 w-5 text-pink-500" />} title="Bookmark & Xuất danh sách">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>Nhấn nút 🔖 trên card gian hàng để bookmark.</li>
          <li>Xem tất cả gian đã bookmark tại <strong>Profile → Gian hàng đã lưu</strong>.</li>
          <li>Xuất danh sách bookmark dưới dạng file để mang theo khi đi festival.</li>
        </ul>
      </Section>

      {/* Section: Ảnh */}
      <Section icon={<ImageIcon className="h-5 w-5 text-indigo-500" />} title="Đăng ảnh sample">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>Mỗi gian có thể đăng <strong>nhiều ảnh</strong> — mỗi ảnh gắn tag fandom & loại mặt hàng riêng.</li>
          <li>Ảnh nên <strong>≤ 3MB</strong> để đảm bảo tải lên thành công.</li>
          <li>Nhấn vào ảnh trên trang chi tiết để phóng to (zoom), kéo để xem chi tiết.</li>
          <li><strong>Mặt hàng nổi bật:</strong> Chọn 1 sản phẩm tâm đắc nhất — sẽ hiện ở trang &ldquo;Nổi bật&rdquo;.</li>
        </ul>
      </Section>

      {/* Section: FAQ */}
      <Section icon={<HelpCircle className="h-5 w-5 text-amber-500" />} title="Câu hỏi thường gặp">
        <div className="space-y-4 text-sm">
          <FaqItem
            q="Tôi không thấy nút sửa/xoá gian hàng?"
            a="Nút sửa/xoá chỉ hiện cho chủ gian hàng. Hãy chắc chắn bạn đã đăng nhập đúng tài khoản đã dùng để đăng bài."
          />
          <FaqItem
            q="Ảnh upload bị lỗi?"
            a="Hãy kiểm tra dung lượng ảnh (≤ 3MB). Nếu ảnh quá lớn, hãy giảm kích thước trước khi upload."
          />
          <FaqItem
            q="Gian hàng tham gia 2 festival, tiêu đề ghi sao?"
            a={<>Ghi mã festival + số gian cho mỗi festival, ví dụ: <code className="bg-grey-50 dark:bg-muted px-1 rounded">COFI15: B12 | ABC: 54 - Tiệm Mực</code>. Hoặc tạo bài đăng riêng cho mỗi festival.</>}
          />
          <FaqItem
            q="Trade request gửi rồi nhưng không thấy phản hồi?"
            a="Chủ OC sẽ nhận thông báo. Hãy kiên nhẫn chờ, hoặc liên hệ trực tiếp nếu bạn đã cung cấp thông tin liên hệ trong lời mời trade."
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="pl-1">{children}</div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium">❓ {q}</p>
      <p className="text-muted-foreground mt-1">{a}</p>
    </div>
  );
}
