# Hibu Hanzi · 学汉字 · Học Hán Tự & Chiết Tự

Ứng dụng web học chữ Hán thụ động dành riêng cho người Việt, khai thác tối đa lợi thế **Âm Hán Việt**, **Bộ thủ** và **Chiết tự** (mẹo nhớ và nguồn gốc chữ). 

Xem chi tiết thiết kế sản phẩm tại [DESIGN.md](DESIGN.md).

---

## 🚀 Chạy trên môi trường phát triển (Local)

```bash
# FE và BE là hai repo độc lập, mỗi repo tự cài đặt riêng
cd FE

# 1. Cài đặt các phụ thuộc
npm install

# 2. Khởi động Web Dev Server
npm run dev
# Mở trình duyệt tại: http://localhost:5173

# 3. Kiểm tra kiểu TypeScript & Build
npm run build
```

---

## ☁️ Triển khai lên Cloudflare Pages

Dự án được tối ưu 100% để chạy tĩnh (Static SPA) trên **Cloudflare Pages** mà không cần cấu hình server PostgreSQL phức tạp:

1. Đẩy mã nguồn lên kho Git (GitHub / GitLab).
2. Trên dashboard **Cloudflare Pages**, tạo project mới trỏ vào repository.
3. Thiết lập thông số Build:
   - **Framework preset**: `Vite` (hoặc `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: để trống nếu FE là repo riêng (`FE` nếu vẫn chung repo)
4. File [FE/public/_redirects](FE/public/_redirects) đã được cấu hình sẵn để hỗ trợ routing SPA mượt mà trên Cloudflare.

---

## ✨ Các tính năng nổi bật (v0.1)

- **Thẻ Widget học thụ động**:
  - Chữ Hán to rõ, hỗ trợ chuyển đổi font: **Thư pháp** (`Ma Shan Zheng`), **Khải thư** (`Noto Serif SC`), hoặc Không chân.
  - **Âm Hán Việt viết hoa nổi bật**: Giúp nhận biết ngay nghĩa quen thuộc trong vốn từ tiếng Việt (好 = HẢO, 明 = MINH, 银行 = NGÂN HÀNG, 问题 = VẤN ĐỀ...).
  - **Pinyin** kèm dấu thanh điệu chuẩn.
  - **Phát âm Audio**: Đọc chuẩn tiếng Trung qua Web Speech Synthesis (`zh-CN`).
- **Nét viết bút thuận (Hanzi Writer)**:
  - Xem animation thứ tự từng nét viết chuẩn trên ô kẻ mễ tự/điền tự.
  - Tùy chỉnh tốc độ (0.75x, 1x, 1.5x) và làm nổi bật bộ thủ.
  - **Chế độ tập viết (Quiz/Practice canvas)**: Tự tay vẽ nét chữ với phản hồi thị giác tức thì.
- **Chiết tự & Bộ thủ chuyên sâu**:
  - Bộ thủ chủ quản kèm tên gọi tiếng Việt và ý nghĩa.
  - Chiết tự mẹo nhớ dân gian và nguồn gốc hình thành chữ Hán.
  - Phân tích từng thành phần cấu tạo (bấm vào thành phần để tra cứu tiếp).
  - Danh sách từ ghép thông dụng (bấm vào chữ trong từ ghép để xem chi tiết chữ đó).
- **Chu kỳ tự chuyển chữ (Auto-cycle Timer)**:
  - Chọn chu kỳ: 15s, 30s, 1 phút, 5 phút, hoặc Tắt (chuyển thủ công).
  - Thanh đếm ngược và nút tạm dừng/tiếp tục.
- **Tra cứu nhanh (Search)**: Tra theo chữ Hán, Pinyin, âm Hán Việt hoặc nghĩa tiếng Việt (`Ctrl+K`).
- **Sổ tay chữ đã lưu (Favorites)**: Đánh dấu sao các chữ cần ôn tập, lưu cục bộ trên trình duyệt.
- **Giao diện hiện đại**: Hỗ trợ chế độ Sáng (Giấy dó truyền thống / Rice paper) và Tối (Đá phiến obsidian), hiệu ứng chuyển động mượt mà.

### ⌨️ Phím tắt tiện ích
| Phím | Tác vụ |
|---|---|
| `Space` | Chọn chữ ngẫu nhiên khác |
| `→` / `←` | Chữ kế tiếp / Chữ trước đó |
| `W` | Mở màn hình tập nét viết |
| `D` | Mở màn hình chiết tự & bộ thủ |
| `F` | Bật/tắt lưu chữ vào sổ tay |
| `Ctrl+K` | Mở hộp thoại tìm kiếm |
| `Esc` | Đóng các hộp thoại đang mở |

---

## 📁 Cấu trúc Monorepo

```
Hibu_Hanzi/
├─ FE/                 # Repo frontend: React + Vite, Widget, HanziWriter, dữ liệu offline (src/core/)
├─ BE/                 # Repo backend: Node + Hono + Postgres (Supabase), SQL trong BE/db/
├─ data-tools/          # Công cụ xử lý & kiểm thử dữ liệu
└─ DESIGN.md            # Tài liệu thiết kế kỹ thuật và lộ trình sản phẩm
```

---

## ☁️ Triển khai BE lên Cloudflare Workers

BE có hai điểm chạy dùng chung một bộ route (`src/app.ts`):

| Lệnh | Chạy | Dùng khi |
|---|---|---|
| `npm run dev` | Node (`src/index.ts`) | Phát triển hằng ngày |
| `npm run dev:worker` | Workers runtime (`src/worker.ts`) | Thử đúng môi trường production |
| `npm run deploy` | Đẩy `src/worker.ts` lên Cloudflare | Phát hành |

### Lần đầu

```bash
cd BE
npx wrangler login

# 1. Hyperdrive giữ kết nối tới Supabase. Dùng chuỗi "Session pooler" (cổng 5432) của Supabase,
#    BỎ phần ?sslmode=no-verify ở cuối.
npx wrangler hyperdrive create hibu-db \
  --connection-string="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
#    Dán id nó in ra vào wrangler.toml, thay cho PASTE_HYPERDRIVE_ID_HERE.

# 2. Mã cho trang /admin trên production (nên khác mã dùng ở máy local).
npx wrangler secret put ADMIN_TOKEN

# 3. Deploy. Lệnh in ra địa chỉ dạng https://hibu-api.<tên-tài-khoản>.workers.dev
npm run deploy
```

Sau đó, trong Cloudflare Pages của FE: **Settings → Environment variables**, đặt
`VITE_API_URL` = địa chỉ Worker ở trên, rồi build lại FE.

### Những lần sau

```bash
npm run deploy
```

### Đã có sẵn trong Worker

- **Rate limit** 120 request/phút mỗi IP (`[[ratelimits]]` trong `wrangler.toml`). `/admin` không bị tính.
- **Ping Supabase hằng ngày** lúc 03:00 UTC (`[triggers] crons`) để project Free không tự tạm dừng.
- **Log**: Cloudflare dashboard → Workers → hibu-api → Logs.

### Chạy thử Worker trên máy

```bash
# Hyperdrive khi chạy local nối thẳng tới DB bằng chuỗi này:
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="$(grep ^DATABASE_URL .env | cut -d= -f2-)"
echo "ADMIN_TOKEN=$(grep ^ADMIN_TOKEN .env | cut -d= -f2)" > .dev.vars
npm run dev:worker          # http://localhost:8787
```
