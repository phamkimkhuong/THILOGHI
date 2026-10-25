# THILOGI Web Logistics Operating Platform

> **Nền tảng Quản trị Vận hành Logistics Tích hợp (Release 1 - Core Business Loop)**  
> **Chủ đầu tư / Đơn vị vận hành:** Tập đoàn Logistics Chu Lai (THILOGI) • THACO Group  
> **Định hướng chiến lược:** 2026 – 2030 (Chuyển đổi số từ AppSheet/Excel sang Logistics Operating System)

---

## 1. TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIỆP VỤ

### 1.1. Bối Cảnh Chuyển Đổi Số
THILOGI là đơn vị trung gian tích hợp logistics (Logistics Integrator / Forwarder) hàng đầu khu vực miền Trung, sở hữu hạ tầng khép kín gồm: Cảng Quốc tế Chu Lai, đội xe đầu kéo đường bộ, bến bãi depot, kho ngoại quan/kho nông sản và mạng lưới vận tải liên vận xuyên biên giới kết nối 3 quốc gia **Việt Nam – Nam Lào – Bắc Campuchia**.

Hệ thống hiện tại (AS-IS) vận hành dựa trên Google AppSheet và các file Excel phân tán, bộc lộ các nút thắt lớn:
- Thiếu tính toàn vẹn dữ liệu (Referential Integrity) của CSDL quan hệ.
- Dễ thất thoát chi phí thực tế (Actual Costs) và trôi lệch tỷ giá hối đoái (FX Drift).
- Chưa phân tách rõ ràng giữa trạng thái hoàn thành giao nhận ngoài thực địa (**Operationally Closed**) với trạng thái đối soát chốt sổ công nợ tài chính (**Financially Closed**).

### 1.2. Mục Tiêu Nền Tảng (TO-BE)
Xây dựng một **Logistics Operating Platform** thống nhất trên nền tảng **Next.js Full-Stack + PostgreSQL 16**, quản trị liền mạch toàn bộ vòng lặp nghiệp vụ cốt lõi:
$$\text{Customer Requirement} \longrightarrow \text{Rate Lookup} \longrightarrow \text{Quotation (Immutable Lock)} \longrightarrow \text{Order (P\&L Center)} \longrightarrow \text{Fulfillment} \longrightarrow \text{Delivery Proof} \longrightarrow \text{Actual Cost} \longrightarrow \text{Reconciliation} \longrightarrow \text{Financial Close}$$

### 1.3. Chuẩn Hóa 8 Gói Dịch Vụ Cung Ứng (Service Packages)
1. **`TRUCKING` (Vận tải đường bộ):** Đội xe đầu kéo, rơ-moóc cont bạt, cont lạnh chạy nội địa và liên vận quốc tế (Bờ Y, Nam Giang, Lao Bảo...).
2. **`OCEAN` (Vận tải biển quốc tế):** Vận chuyển FCL/LCL kết nối Cảng Chu Lai, Cảng Tiên Sa và các tuyến biển quốc tế.
3. **`PORT` (Dịch vụ Cảng & Depot):** Nâng hạ (LOLO), đảo chuyển container, bãi lưu cont, cắm điện lạnh container reefer.
4. **`CUSTOMS` (Thủ tục Hải quan):** Khai báo hải quan điện tử tờ khai XNK kinh doanh, gia công, tạm nhập tái xuất, quá cảnh.
5. **`BORDER_GATE` (Hiện trường Cửa khẩu):** Tác nghiệp tại bãi giám sát cửa khẩu: sang xe, hạ bãi, đổi đầu kéo, kiểm dịch, cân tải.
6. **`WAREHOUSING` (Dịch vụ Kho bãi):** Lưu kho nông sản, kho CFS, kho ngoại quan, bốc xếp và đóng rút hàng.
7. **`INSURANCE` (Bảo hiểm Hàng hóa):** Tính phí bảo hiểm (Premium) theo giá trị bảo hiểm (Insured Value) và kiểm soát mức khấu trừ.
8. **`OTHER` (Dịch vụ Bổ trợ Đặc thù):** Hun trùng, kiểm dịch thực vật, xin cấp C/O xuất xứ và các dịch vụ hiện trường có kiểm soát mã phí.

---

## 2. KIẾN TRÚC & CÔNG NGHỆ ÁP DỤNG (TECH STACK)

Hệ thống được thiết kế theo mô hình **Modular Monolith** triển khai gọn gàng trên **1 VPS**, tối đa hóa hiệu quả đầu tư và tốc độ phát triển:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THILOGI WEB LOGISTICS PLATFORM                       │
│                                                                        │
│   [ Presentation Layer ]  Client Components (Forms, Grids, Workspaces) │
│            │                                                           │
│            ▼                                                           │
│   [ Next.js Server Layer] Server Components (Direct DB Reads)          │
│            │              Server Actions (Mutations & Authorization)   │
│            ▼                                                           │
│   [ Domain Modules Layer] Master Data · Pricing Engine · Order P&L     │
│            │              Rate Lookup · Cost Allocation · Closeout     │
│            ▼                                                           │
│   [ Data Access Layer ]   Drizzle ORM + Connection Pool (max: 20)      │
│            │                                                           │
│            ▼                                                           │
│   [ PostgreSQL 16 DB ]    ACID · Range Types · btree_gist Constraints │
└────────────────────────────────────────────────────────────────────────┘
```

| Thành Phần | Công Nghệ Lựa Chọn | Lý Do & Vai Trò Trong Hệ Thống |
| :--- | :--- | :--- |
| **Ứng dụng Web** | **Next.js 15 (App Router)** | Full-Stack trong 1 codebase; kết hợp Server Components và Server Actions. |
| **Ngôn ngữ** | **TypeScript 5** | Đảm bảo an toàn kiểu dữ liệu từ CSDL đến Giao diện người dùng (End-to-End Type Safety). |
| **Giao diện (UI)** | **TailwindCSS v4 + Lucide Icons** | Giao diện quản trị phong cách Enterprise Dark Mode, trực quan, tối ưu cho văn phòng và điều độ. |
| **Cơ sở Dữ liệu** | **PostgreSQL 16 (Alpine)** | RDBMS tin cậy, giao dịch ACID, hỗ trợ toàn vẹn khóa ngoại (FK) và báo cáo tài chính. |
| **Chỉ mục Nâng cao** | **Extension `btree_gist`** | Hỗ trợ ràng buộc loại trừ (`EXCLUDE USING gist`) ngăn chặn $100\%$ xung đột dải ngày bảng giá. |
| **Truy vấn Dữ liệu** | **Drizzle ORM & Drizzle Kit** | Type-safe SQL query builder siêu nhẹ, quản trị migration schema minh bạch. |
| **Tính toán Tài chính** | **`decimal.js`** | Xử lý số học dấu phẩy động chính xác tuyệt đối, loại trừ lỗi làm tròn tiền tệ kế toán. |
| **Đóng gói Triển khai** | **Docker & Docker Compose** | Multi-stage build (`output: "standalone"`, image $<150\text{MB}$), vận hành nhẹ nhàng trên 1 VPS. |

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
d:\a_duan\THILOGHI/
├── database/
│   └── init/
│       ├── 01-init-extensions.sql       # Kích hoạt btree_gist, uuid-ossp, citext
│       └── 02-schema-r1.sql             # 10 ENUMs, Master Data, Road Rates & Quotation DDL
│
├── docx/
│   ├── THILOGI_VPS_DATABASE_SECURITY_GUIDELINES.docx # Tài liệu an ninh DB cho quản lý IT (Word)
│   └── THILOGI_VPS_DATABASE_SECURITY_GUIDELINES.md   # Hướng dẫn chi tiết thiết lập bảo mật VPS
│
├── scripts/
│   └── generate_docx.js                 # Script tự động xuất văn bản Word từ mã nguồn
│
├── src/
│   ├── app/                             # Next.js App Router (Routing & Presentation)
│   │   ├── api/
│   │   │   └── health/route.ts          # Endpoint giám sát kết nối CSDL và extension btree_gist
│   │   ├── layout.tsx                   # Bố cục chuẩn (Root Layout, Typography Inter & Dark Theme)
│   │   ├── page.tsx                     # Bảng điều khiển Console Trung tâm (KPIs & 10 Bước Vận Hành)
│   │   └── globals.css                  # Thiết lập theme TailwindCSS v4
│   │
│   └── server/                          # Tầng xử lý phía Server (Cô lập Domain Logic)
│       ├── db/
│       │   ├── index.ts                 # Singleton connection pool (max: 20) & testDbConnection
│       │   └── schema.ts                # Drizzle schema định nghĩa bảng, quan hệ và ENUMs
│       │
│       └── modules/                     # Các phân hệ nghiệp vụ độc lập (Modular Monolith)
│           ├── master-data/             # Quản lý Khách hàng, Địa điểm, Cửa khẩu, Mặt hàng
│           └── supplier-pricing/
│               └── rate-lookup.service.ts # Động cơ tra cứu giá Mua (Candidate Search & Worst-case BUY)
│
├── THILOGI/                             # Thư mục chứa 27+ hồ sơ tài liệu gốc, BRS, training & Excel mẫu
├── docker-compose.yml                   # Cấu hình container PostgreSQL 16 + Next.js App
├── Dockerfile                           # Multi-stage production build cho Next.js standalone
├── drizzle.config.ts                    # Cấu hình Drizzle Kit CLI
├── next.config.ts                       # Cấu hình Next.js (output: standalone)
├── package.json                         # Danh mục thư viện phụ thuộc và scripts vận hành
├── .env.example                         # Mẫu cấu hình biến môi trường
└── .env.local                           # Biến môi trường cục bộ (DATABASE_URL, PORT)
```

---

## 4. BỘ QUY TẮC NGHIỆP VỤ CỐT LÕI (CHUẨN HÓA P0 & P1)

Hệ thống tuân thủ nghiêm ngặt các quy tắc kiến trúc và nghiệp vụ đã được thống nhất:

### Nhóm P0: Ràng Buộc Kiến Trúc Tối Khẩn Cấp
1. **Sửa Đổi Thuật Toán Rate Lookup:**
   - Khi có nhiều nhà xe cùng báo giá cho 1 tuyến $\rightarrow$ Trả về `MULTIPLE_CANDIDATES` để lựa chọn, **không phải lỗi xung đột**.
   - Trạng thái `CONFLICT_RATE` chỉ xảy ra khi **cùng $1$ Nhà cung cấp** có các bảng giá Approved bị chồng lấn dải ngày hiệu lực (được PostgreSQL tự động chặn qua `EXCLUDE USING gist`).
2. **Dịch Vụ Phụ Trợ (Ancillary Services) Phải Tường Minh:**
   - Tuyến đường xe chạy không tự động sinh ra các gói bán (SELL) phụ trợ. Các khoản phí nâng hạ, lưu bãi, kiểm dịch **chỉ được tạo khi người dùng chủ động chọn** trong danh mục `quotation_service_items` hoặc `order_service_items`.
3. **Loại Bỏ Hoàn Toàn Thuật Ngữ Cũ D2D / D2P / P2D / P2P:**
   - Tuyến vận tải được quản lý linh hoạt $100\%$ qua cặp địa điểm `(pickup_location_id, delivery_location_id)`. Tính chất Cảng, Bãi, Kho hay Cửa khẩu được định danh qua thuộc tính `location_type` của bảng `locations`.
4. **Chuẩn Hóa Thuật Ngữ Quốc Tế Về POD:**
   - Ký hiệu **`POD`** dành riêng và duy nhất cho **Port of Discharge (Cảng dỡ hàng)**.
   - Bằng chứng giao nhận hàng được đổi tên chính thức thành **Delivery Proof** (`delivery_proof_file`, `delivery_proof_verified`).
5. **Quản Lý Công Nợ AR/AP Ở Cấp Độ Hóa Đơn (Invoice Level):**
   - Số dư công nợ (`open_balance_vnd`) được quản lý tập trung trên Hóa đơn GTGT khách hàng (`customer_invoices`) và Hóa đơn NCC (`vendor_invoices`).
   - Kế toán thực hiện phân bổ giá trị hóa đơn về từng Đơn hàng qua bảng `customer_invoice_allocations` và `vendor_invoice_allocations`.

### Nhóm P1: Quy Tắc Vận Hành Thực Địa
6. **Fulfillment Đường Biển (Ocean Engine):**
   - Đơn hàng có vận tải biển chỉ khởi tạo `OCEAN_WORK_REQUEST` (trạng thái `PENDING_BOOKING`).
   - Bản ghi chuyến tàu thực tế `SEA_SHIPMENT` chỉ được liên kết khi đội Ocean Ops chốt số hiệu tàu, số chuyến, Booking và Bill thực tế từ hãng tàu.
7. **Phát Hành Lệnh Vận Tải Theo Từng Đợt (Partial Release):**
   - Chuyến xe `shipping_orders` chỉ được sinh ra khi bấm **Release to Operations**.
   - Hỗ trợ bàn giao từng phần qua cặp trường `planned_trip_qty` và `released_trip_qty` (ví dụ: đơn hàng 50 cont, release 10 cont hôm nay, 40 cont còn lại lưu kế hoạch).
8. **Kiểm Soát Biến Động Nhiên Liệu (Fuel Change):**
   - Biến động giá dầu chỉ tác động lên bài toán chi phí nội bộ (BUY). **Chỉ tạo Quotation Version mới khi hai bên thống nhất thay đổi giá bán (SELL)**.

### Nhóm Giữ Nguyên (Các Trụ Cột Bất Biến)
- **Immutable Approved Quotation:** Báo giá khi chuyển sang `APPROVED` bị khóa cứng (`Read-Only`) ở cả tầng Database và ứng dụng. Mọi thay đổi thương mại bắt buộc phải tăng `version + 1`.
- **ORDER Là Trung Tâm P&L Độc Lập:** Mọi doanh thu và chi phí thực tế (`ACTUAL_COSTS`) đều quy tụ về Order với đồng tiền chuẩn duy nhất là **VND**.
- **Khóa Sổ 2 Cột Mốc Độc Lập (UAT-12):**
  - **Đóng Vận hành (`OPERATIONALLY_CLOSED`):** Đã giao xong hàng, container đã trả bãi, đủ biên bản bàn giao.
  - **Đóng Tài chính (`FINANCIALLY_CLOSED`):** Khớp $100\%$ hóa đơn kế toán, không còn chi phí phát sinh trôi nổi và công nợ đã được thu hồi hoặc có bảo lãnh tín dụng.

---

## 5. VÒNG LẶP NGHIỆP VỤ LÕI 10 BƯỚC (CORE BUSINESS LOOP)

```
[Bước 1: Tiếp nhận Nhu cầu (Sales)]
          │ Khởi tạo Báo giá Nháp (Draft), chọn Khách hàng & Tuyến đường
          ▼
[Bước 2: Tra cứu Giá Mua BUY (Pricing Engine)]
          │ Candidate Search -> Check Conflict -> Snapshot BUY & Tính Worst-case BUY
          ▼
[Bước 3: Cấu thành Giá Bán SELL & Kiểm tra Margin]
          │ Tự động tính GP = SELL - BUY; Kiểm tra ngưỡng Min Margin / Target Margin
          ▼
[Bước 4: Thẩm định & Phê duyệt (Approval Matrix)]
          │ Phê duyệt theo Region Scope -> Kích hoạt cơ chế KHÓA BẤT BIẾN (Immutable Lock)
          ▼
[Bước 5: Khởi tạo Đơn Hàng (Order P&L Center)]
          │ Kế thừa 100% dữ liệu thương mại, khởi tạo P&L Ledger bằng đồng tiền chuẩn VND
          ▼
[Bước 6: Bàn giao Vận hành (Release to Operations)]
          │ Sinh Lệnh điều xe (Shipping Orders - hỗ trợ Partial Release) & Ocean Work Requests
          ▼
[Bước 7: Điều hành, Bàn giao & Theo dõi Milestones]
          │ Giám sát hành trình, đổi đầu kéo tại cửa khẩu quốc tế, ghi nhận ngoại lệ chi phí
          ▼
[Bước 8: Xác minh Bộ Chứng Từ (Checklist Gatekeeper)]
          │ Bắt buộc đủ Delivery Proof có chữ ký, Tờ khai hải quan thông quan, Bill gốc
          ▼
[Bước 9: Tập hợp Chi phí Thực tế & Đối soát Tài chính]
          │ Actual Cost Ledger, bổ chi phí dùng chung (Shared Cost Allocation) & Khớp hóa đơn AP/AR
          ▼
[Bước 10: Khóa Sổ Kiểm Soát 2 Giai Đoạn]
          │ Cột mốc 1: Operationally Closed  --->  Cột mốc 2: Financially Closed (UAT-12)
```

---

## 6. HƯỚNG DẪN CÀI ĐẶT & KHỞI ĐỘNG (GETTING STARTED)

### 6.1. Yêu Cầu Môi Trường (Prerequisites)
- **Node.js:** Phiên bản 20.x trở lên (`node -v`).
- **Docker & Docker Compose:** Đã cài đặt trên máy chủ phát triển hoặc VPS.

### 6.2. Các Bước Khởi Chạy Nhanh

#### Bước 1: Khởi động Cơ sở Dữ liệu PostgreSQL bằng Docker Compose
Chạy lệnh sau tại thư mục gốc dự án:
```bash
docker compose up -d postgres
```
> **Lưu ý:** Container PostgreSQL sẽ tự động kích hoạt extension `btree_gist`, `uuid-ossp` và nạp sẵn toàn bộ 15 bảng DDL Release 1 cùng dữ liệu mẫu ban đầu từ thư mục `database/init/`.

#### Bước 2: Thiết lập biến môi trường
Tạo file `.env.local` tại thư mục gốc (nếu chưa có):
```env
DATABASE_URL="postgres://thilogi_admin:thilogi_secure_2026@localhost:5432/thilogi_db"
NODE_ENV=development
PORT=3000
```

#### Bước 3: Khởi chạy ứng dụng Next.js ở chế độ phát triển
```bash
npm run dev
```
Mở trình duyệt web và truy cập: **`http://localhost:3000`**  
*(Giao diện Bảng điều khiển Console Trung tâm của THILOGI sẽ sẵn sàng tác nghiệp)*.

#### Bước 4: Kiểm tra trực quan CSDL bằng Drizzle Studio
```bash
npm run db:studio
```
Truy cập giao diện quản trị dữ liệu trực quan tại: **`https://local.drizzle.studio`**.

---

## 7. DANH SÁCH CÁC LỆNH VẬN HÀNH (CLI SCRIPTS)

Trong file `package.json`, các script quản trị đã được thiết lập sẵn:

```bash
# Khởi chạy môi trường phát triển (Dev Server)
npm run dev

# Kiểm tra biên dịch tĩnh & đóng gói production (Type-check & Build)
npm run build

# Khởi chạy bản build production
npm start

# Quản trị cơ sở dữ liệu với Drizzle Kit
npm run db:generate   # Sinh mã SQL migrations mới từ schema.ts
npm run db:push       # Đồng bộ cấu trúc schema trực tiếp vào PostgreSQL
npm run db:studio     # Mở giao diện trực quan Drizzle Studio

# Xuất lại tài liệu bảo mật Word (.docx)
node scripts/generate_docx.js
```

---

## 8. HỒ SƠ TÀI LIỆU DỰ ÁN LIÊN QUAN

- [THILOGI/](file:///d:/a_duan/THILOGHI/THILOGI): Thư mục lưu trữ 27+ tài liệu nghiệp vụ gốc (BRS V1.0, Target Architecture 2030, SOP vận hành, tài liệu đào tạo 8 gói dịch vụ, kịch bản UAT).
- [docx/THILOGI_VPS_DATABASE_SECURITY_GUIDELINES.md](file:///d:/a_duan/THILOGHI/docx/THILOGI_VPS_DATABASE_SECURITY_GUIDELINES.md): Tiêu chuẩn an ninh và bảo mật CSDL PostgreSQL trên môi trường VPS (chặn port 5432, Swap 4GB, Auto Backup).
- [docx/THILOGI_VPS_DATABASE_SECURITY_GUIDELINES.docx](file:///d:/a_duan/THILOGHI/docx/THILOGI_VPS_DATABASE_SECURITY_GUIDELINES.docx): Văn bản Microsoft Word tiêu chuẩn phục vụ công tác kiểm toán an ninh IT.
- [database/init/02-schema-r1.sql](file:///d:/a_duan/THILOGHI/database/init/02-schema-r1.sql): Tệp DDL PostgreSQL chuẩn hóa Release 1.

---
*© 2026 Tập đoàn Logistics Chu Lai (THILOGI) • THACO Group. Bản quyền thuộc về Dự án Chuyển Đổi Số Nền Tảng Quản Trị Vận Hành Logistics.*
