# Hán Việt Widget: Tài liệu thiết kế

> Trạng thái: **đã chốt hướng đi**. Mã nguồn đóng, nhóm phát triển nội bộ 10 người.

## 1. Bối cảnh

Người Việt học tiếng Trung rất đông: học sinh cấp 2–3, sinh viên, người đi làm, người buôn hàng Trung Quốc. Phần lớn app học tiếng Trung hiện nay:

- Dịch nghĩa sang tiếng Anh, hoặc dịch tiếng Việt một cách sơ sài.
- Học theo bài, bắt người dùng mở app ra và dành thời gian riêng để học.
- **Không khai thác âm Hán Việt**, dù đây là lợi thế lớn nhất của người Việt: khoảng 60–70% từ vựng tiếng Việt có gốc Hán, nên rất nhiều từ tiếng Trung người Việt đọc âm Hán Việt là đoán được nghĩa (注意 = chú ý, 经济 = kinh tế, 问题 = vấn đề).

Sản phẩm giúp người dùng **học thụ động** qua một widget luôn hiện trên màn hình. Mỗi chữ được giải thích bằng **bộ thủ, thành phần, Hán Việt và chiết tự**.

## 2. Vì sao cần sản phẩm này

| Vấn đề | Cách sản phẩm giải quyết |
|---|---|
| Không có thời gian ngồi học | Widget luôn nằm ở góc màn hình, chữ tự đổi theo chu kỳ, nhìn là học |
| Chữ Hán khó nhớ, trông như hình vẽ | Tách chữ thành bộ thủ và thành phần, giải nghĩa từng phần rồi ghép lại |
| Học vẹt, không hiểu vì sao chữ có nghĩa đó | Chiết tự kiểu Việt: 好 = 女 + 子, "có vợ có con là tốt" |
| Không tận dụng được vốn tiếng Việt | Mỗi chữ và mỗi từ đều có âm Hán Việt, người học tự đoán được nghĩa |
| App nước ngoài không hiểu người Việt | Nội dung do người Việt làm cho người Việt |

**Điểm khác biệt:** cách học "Hán Việt và chiết tự" chỉ người Việt làm được. Bộ dữ liệu đã được kiểm tra kỹ là tài sản chính của sản phẩm.

## 3. Đối tượng người dùng

- **Chính:** người mới bắt đầu đến khoảng HSK4, gồm học sinh cấp 2–3 và sinh viên.
- **Mở rộng (hướng thu phí):** giáo viên và trung tâm tiếng Trung (chế độ lớp học), người buôn hàng Taobao/1688 (bộ từ chuyên dụng).
- **Không nhắm tới:** người học trình độ cao. Họ đã có Pleco, Anki.

## 4. Lộ trình nền tảng

```
Bước 1  Web (React)        test trên trình duyệt Linux
Bước 2  PWA                cài lên iPhone qua Safari, "Thêm vào màn hình chính"
Bước 3  Tauri              widget desktop; test trên Linux, GitHub Actions build .exe
Bước 4  Expo (React Native) app iOS/Android thật, khi đã có người dùng
```

- Bước 1–3 dùng chung một code giao diện.
- Bước 4 viết lại giao diện, nhưng dùng lại logic trong `FE/src/core`.
- Không cần Mac: test iOS bằng Expo Go, build bằng EAS Build trên cloud (cần tài khoản Apple Developer, 99 USD/năm).
- Giới hạn: PWA không làm được widget màn hình khóa hay màn hình chính trên iPhone. Phải đến bước 4 mới có.

## 5. Chức năng

### v0.1 (web)
- Chọn chuẩn HSK (2.0 hoặc 3.0) và cấp độ, hiện ngẫu nhiên một chữ hoặc một từ theo chu kỳ (người dùng chọn số phút).
- Hiện: chữ Hán, pinyin, âm Hán Việt, nghĩa tiếng Việt.
- Bấm vào chữ để xem animation nét viết (Hanzi Writer).
- Màn chi tiết: bộ thủ, các thành phần, nghĩa và Hán Việt từng phần, chiết tự.
- Từ ghép: tách thành từng chữ, mỗi chữ lại tách tiếp được.

### v0.2 (PWA + Tauri)
- Cài được lên iPhone, dùng offline phần dữ liệu cơ bản.
- Widget desktop: không viền, luôn nổi trên cùng, kéo thả và đổi kích thước được, nhớ vị trí khi mở lại.
- Đồng bộ dữ liệu ở chế độ nền.

> v0.1: web gọi API trực tiếp (chưa lưu IndexedDB), nên cần mạng. Gói cơ bản offline làm ở v0.2.

### Sau này
- Chế độ hình nền: tự đổi hình nền Windows theo chữ.
- Quiz đoán nghĩa từ Hán Việt.
- Đánh dấu chữ đã thuộc, ôn tập lặp lại ngắt quãng.
- Tài khoản, đồng bộ tiến độ giữa các thiết bị.
- App mobile (Expo), widget màn hình khóa.
- Chế độ lớp học cho giáo viên và trung tâm.
- Bộ từ theo giáo trình (Giáo trình Hán ngữ, Boya), bộ từ buôn hàng.

## 6. Thiết kế hệ thống

```
┌──────────────────── Máy người dùng ─────────────────────┐
│  App (React: web / PWA / Tauri)                         │
│     │                                                   │
│     ▼                                                   │
│  Dữ liệu local                                          │
│   ├─ Gói cơ bản đóng sẵn: HSK1–2 (chữ, pinyin,          │
│   │  Hán Việt, nghĩa) → luôn chạy được offline          │
│   ├─ Cache: những chữ người dùng đã xem                 │
│   └─ Nét viết: HSK1–2 đóng sẵn, còn lại tải khi cần     │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS, có giới hạn số request
                ▼
┌──────────────────── Server ─────────────────────────────┐
│  API                                                    │
│   GET /version                 phiên bản gói cơ bản     │
│   GET /bundle?since=<version>  cập nhật gói cơ bản      │
│   GET /characters/:hanzi       chi tiết 1 chữ           │
│   GET /words/:word             chi tiết 1 từ            │
│  PostgreSQL: nguồn dữ liệu gốc, nơi nhóm biên tập       │
└─────────────────────────────────────────────────────────┘
```

**Nguyên tắc:**

1. **Đọc local trước.** Khi khởi động, app hiện chữ ngay từ gói cơ bản, không chờ mạng.
2. **Đồng bộ ở chế độ nền.** App kiểm tra `/version`. Nếu có bản mới thì tải phần thay đổi. Mất mạng thì bỏ qua.
3. **Phần dữ liệu quý lấy qua API**: tách thành phần, chiết tự, HSK3 trở lên. Lấy theo từng chữ khi người dùng xem, rồi lưu cache.
4. **Không bao giờ gửi toàn bộ DB xuống máy người dùng.**

Đánh đổi: khi offline, chỉ dùng được gói cơ bản và những chữ đã xem. Phần dữ liệu đầy đủ chính là phần sau này có thể thu phí.

## 7. Thiết kế DB (server, PostgreSQL)

Nguyên tắc: **ít bảng, chỉ thêm bảng khi dữ liệu thật sự cần** (chữ đa âm, thành phần không phải chữ). Chữ dùng **giản thể** là chính, phồn thể chỉ là một cột phụ để hiển thị.

```sql
-- Thành phần không phải chữ độc lập: 214 bộ thủ, biến thể (氵, 亻), nét/khối (卩, 龴)
CREATE TABLE components (
  id           SERIAL PRIMARY KEY,
  form         TEXT NOT NULL UNIQUE,   -- 氵
  variant_of   TEXT,                   -- 水 (NULL nếu là dạng gốc)
  is_radical   BOOLEAN NOT NULL DEFAULT false, -- có thuộc 214 bộ thủ không
  name_vi      TEXT,                   -- bộ Thủy
  han_viet     TEXT,                   -- thủy
  meaning_vi   TEXT,                   -- nước
  stroke_count INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

-- Chữ đơn (~3.000 dòng, đủ HSK1–6)
CREATE TABLE characters (
  id               SERIAL PRIMARY KEY,
  hanzi            TEXT NOT NULL UNIQUE,   -- 好 (giản thể)
  traditional      TEXT,                   -- 學 cho 学; NULL nếu giống giản thể
  radical          TEXT,                   -- 女, tra trong components hoặc characters
  chiet_tu         TEXT,                   -- 女 + 子: có vợ có con là tốt
  chiet_tu_type    TEXT,                   -- 'mnemonic' (mẹo nhớ) | 'etymology' (nguồn gốc thật)
  stroke_count     INTEGER,
  hsk2_level       INTEGER,                -- 1–6, NULL nếu không có trong HSK 2.0
  hsk3_level       INTEGER,                -- 1–7, NULL nếu không có trong HSK 3.0 (7 = nhóm 7–9)
  status           TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'reviewed'
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- Cách đọc của chữ. Đa số chữ có 1 dòng; chữ đa âm có nhiều dòng
-- 行: (xíng, hành, đi) và (háng, hàng, hàng lối)
CREATE TABLE character_readings (
  id          SERIAL PRIMARY KEY,
  char_id     INTEGER NOT NULL REFERENCES characters(id),
  pinyin      TEXT NOT NULL,
  han_viet    TEXT,
  meaning_vi  TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false, -- cách đọc hiện mặc định trên widget
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (char_id, pinyin)
);

-- Thành phần của chữ (~6.000–8.000 dòng)
-- part là chữ khác (女) hoặc một dòng trong components (氵)
CREATE TABLE character_parts (
  char_id   INTEGER NOT NULL REFERENCES characters(id),
  position  INTEGER NOT NULL,          -- thứ tự: 1, 2, ...
  part      TEXT NOT NULL,             -- 女
  PRIMARY KEY (char_id, position)
);

-- Từ ghép (~5.000–11.000 dòng)
CREATE TABLE words (
  id          SERIAL PRIMARY KEY,
  word        TEXT NOT NULL UNIQUE,    -- 银行
  traditional TEXT,                    -- 銀行
  pinyin      TEXT NOT NULL,           -- yín háng
  han_viet    TEXT,                    -- ngân hàng
  meaning_vi  TEXT NOT NULL,           -- ngân hàng (nơi gửi tiền)
  hsk2_level  INTEGER,
  hsk3_level  INTEGER,
  status      TEXT NOT NULL DEFAULT 'draft',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
```

- **Hai chuẩn HSK dùng hai cột** `hsk2_level` và `hsk3_level`, vì cùng một chữ có thể ở cấp khác nhau tùy chuẩn (休息: HSK 2.0 cấp 2, HSK 3.0 cấp 1). Làm HSK 2.0 trước, cột `hsk3_level` điền dần. Chỉ tách bảng `(chữ, chuẩn, cấp)` khi có từ 3–4 hệ chuẩn (ví dụ thêm TOCFL).
- **Chữ đa âm:** cách đọc tách sang `character_readings`. Không tách nghĩa nhỏ hơn mức cách đọc; nhiều nghĩa của cùng một âm viết chung trong `meaning_vi`.
- **Không có bảng nối từ–chữ.** Tách `银行` thành `银`, `行`. Để chọn đúng cách đọc của từng chữ, lấy âm tiết thứ *i* trong `words.pinyin` (`háng`) rồi khớp với `character_readings.pinyin`. Không khớp thì dùng cách đọc `is_primary`.
- **Tra thành phần:** `part` tìm trong `characters` trước, không có thì tìm trong `components`. Không dùng khóa ngoại cho `part` để giữ bảng đơn giản; `data-tools` có script kiểm tra mọi `part` đều tra ra được.
- **Chiết tự:** `chiet_tu_type` phân biệt mẹo nhớ dân gian với nguồn gốc thật, giao diện hiện nhãn tương ứng để không dạy sai.
- **Duyệt dữ liệu:** bản nháp AI có `status = 'draft'`. Chỉ dòng `reviewed` mới được đưa vào gói gửi client.
- **Xóa mềm và phiên bản:** không xóa dòng thật, mà đặt `deleted_at`. Trigger tự cập nhật `updated_at` mỗi lần sửa. Phiên bản dữ liệu chính là `max(updated_at)` (tính bằng micro giây), không cần bảng riêng. `/bundle?since=` trả các dòng đã đổi và danh sách những dòng đã rời gói (bị xóa, quay về draft, hoặc đổi cấp).
- **Chuỗi tra cứu:** từ → các chữ (kèm cách đọc đúng) → bộ thủ và thành phần → nghĩa và Hán Việt từng phần.
- Schema đầy đủ (kèm CHECK, trigger) ở `BE/db/01-schema.sql`.
- Phía client lưu cùng cấu trúc này, nhưng chỉ chứa gói cơ bản và cache, không có `status`, `deleted_at`.

### Kích thước ước tính

| Phần | Số dòng | Dung lượng |
|---|---|---|
| components | ~300 | ~40 KB |
| characters | ~3.000 | ~600 KB |
| character_readings | ~3.500 | ~500 KB |
| character_parts | ~8.000 | ~300 KB |
| words | ~11.000 | ~2 MB |
| **Tổng DB** | | **~3–4 MB** |
| Gói cơ bản HSK1–2 gửi xuống client | | **~200–300 KB** |
| Nét viết (không nằm trong DB) | ~3.000 chữ | ~10 MB; đóng sẵn HSK1–2 khoảng 1–2 MB |

## 8. Công nghệ

| Phần | Lựa chọn |
|---|---|
| Ngôn ngữ | **TypeScript** |
| Giao diện | **React + Vite** |
| Gọi API và cache | TanStack Query |
| Định tuyến | TanStack Router |
| State nhỏ | Zustand (chỉ khi cần) |
| Styling | CSS tự viết hoặc Tailwind; không dùng thư viện UI nặng (widget cần nhẹ) |
| Nét viết | Hanzi Writer + hanzi-writer-data |
| Lưu trữ local | IndexedDB (web/PWA); SQLite qua plugin Tauri (desktop) |
| PWA | vite-plugin-pwa |
| Desktop | Tauri |
| Mobile | Expo (React Native), EAS Build |
| Server | API nhỏ bằng Node (TypeScript, dùng chung kiểu dữ liệu với `core`) + PostgreSQL |
| CI/CD | GitHub Actions (repo private): build web, build .exe Windows |

### Cấu trúc repo (monorepo)

```
hanzi-hanviet/
├─ FE/          repo riêng. React + Vite: web, PWA, Tauri (src-tauri/).
│               src/core/: logic thuần TS (kiểu dữ liệu, đọc/đồng bộ dữ liệu,
│               tách chữ, chọn chữ ngẫu nhiên), không import React.
├─ BE/          repo riêng. API + migration DB. src/core/ chép types + lookup từ FE.
├─ mobile/      Expo (làm sau)
└─ data-tools/   script chuẩn bị dữ liệu (nhập HSK, sinh nghĩa bằng AI, kiểm tra)
```

Quy tắc: logic nghiệp vụ nằm trong `FE/src/core/`, không import React, để sau này mobile dùng lại được. FE và BE không dùng chung package, nên khi đổi `types.ts` hoặc `lookup.ts` phải sửa ở cả hai repo.

## 9. Dữ liệu và AI

- **Danh sách HSK:** lấy từ các bộ dữ liệu HSK công khai, chỉ dùng danh sách chữ/từ và cấp độ.
- **Nét viết và cấu tạo chữ:** Make Me a Hanzi (giấy phép Arphic/LGPL). Dùng nguyên bản và ghi nguồn. **Không sửa dữ liệu nét viết**, vì bản đã sửa có thể phải công khai. Phần cấu tạo chữ của Make Me a Hanzi (LGPL) chỉ dùng để tham khảo; `character_parts` do nhóm tự nhập để tránh bị coi là bản phái sinh. Trước khi thu phí, nhờ người hiểu luật xem lại.
- **Không dùng CC-CEDICT làm nền.** Giấy phép CC BY-SA buộc dữ liệu làm ra từ nó phải chia sẻ lại, không hợp với mã nguồn đóng.
- **Nghĩa tiếng Việt, Hán Việt, chiết tự:** nhóm tự làm, có AI hỗ trợ tạo bản nháp chạy một lần trong `data-tools/`, sau đó người trong nhóm kiểm tra. Đây là tài sản riêng của nhóm.
- **Không tích hợp AI vào app.**

## 10. Chống sao chép

Code chạy trên máy người dùng thì không giấu hoàn toàn được. Mục tiêu là **khiến việc copy tốn công hơn tự làm**, và bảo vệ chủ yếu phần **dữ liệu**.

1. **Repo private.** Chỉ nhóm truy cập.
2. **Không gửi toàn bộ DB xuống client** (xem mục 6). Phần dữ liệu quý lấy từng chữ qua API.
3. **API có giới hạn số request** (chỉ làm chậm việc cào dữ liệu, không chặn được) theo IP, sau này theo tài khoản. Theo dõi các kiểu truy cập bất thường (gọi tuần tự hàng nghìn chữ).
4. **Rút gọn code** khi build production (mặc định của Vite). Không mã hóa cache và không làm rối code thêm: khóa nằm sẵn trong client nên tốn công mà gần như không có tác dụng.
5. **Gắn dấu vết vào dữ liệu:** cài một số chi tiết đặc trưng khó nhận ra để làm bằng chứng nếu bị sao chép. Danh sách các dấu vết chỉ lưu nội bộ, không ghi vào repo.

Lợi thế lâu dài là **tốc độ và chất lượng nội dung**: nhóm liên tục bổ sung và sửa dữ liệu, nên bên copy luôn đi sau một bước.

## 11. Hướng kinh doanh

- Bản cơ bản (HSK1–2, widget) **miễn phí**, là cách để có người dùng.
- Các phần có thể thu phí:
  - Dữ liệu đầy đủ (HSK3–6, tách chữ, chiết tự).
  - Tài khoản, đồng bộ tiến độ, ôn tập thông minh.
  - Chế độ lớp học cho giáo viên và trung tâm (hướng có doanh thu rõ nhất).
  - Bộ từ theo giáo trình, bộ từ chuyên ngành (buôn hàng).
- Ưu tiên trả phí một lần hoặc gói cho trung tâm. Tránh gói thuê bao cho người dùng lẻ ở giai đoạn đầu.
