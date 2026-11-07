<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# QUY CHUẨN KIẾN TRÚC & PHÁT TRIỂN UI/UX THILOGI ERP (BẮT BUỘC)

> **Mục đích:** Đảm bảo mọi màn hình, tính năng hoặc component mới được xây dựng luôn tuân thủ 100% kiến trúc SalesFlow Theme và các nền tảng P1, P2, P3 đã thiết lập. Agent không được tự ý quay lại phong cách cũ hoặc bỏ qua các component dùng chung.

---

## 1. Thiết Kế Màu Sắc & Bảng Mã Giao Diện (SalesFlow Theme)
- **Tông màu chủ đạo:** Light Theme phối hợp Deep Navy (Chuẩn thương hiệu THILOGI & Chu Lai Logistics Hub).
  - Nền trang chính: `bg-[#f5f8fc]` hoặc biến thể `bg-background`.
  - Nền khối/thẻ/bảng (Surface): `bg-surface` (`#ffffff`).
  - Viền phân cách: `border-border` (`#e2e8f0`).
  - Văn bản chính: `text-foreground` (`#16254a`).
  - Văn bản phụ: `text-muted-foreground` (`#64748b`).
  - Điểm nhấn tương tác / Primary: `#2672df` (Blue 600) hoặc `bg-primary`.
  - Sidebar & Top Branding: Deep Navy (`#102f63` -> `#143775` -> `#0d244d`).
- **Điều cấm kỵ:** Tuyệt đối KHÔNG hardcode nền đen tối (`bg-black`, `bg-slate-900`) cho màn hình nghiệp vụ ban ngày. Mọi biến màu sắc phải dùng qua CSS variables đã định nghĩa trong `src/app/globals.css`.

---

## 2. Kiến Trúc Responsive Toàn Hệ Thống (The 3-Tier Architecture)

> **Nguyên tắc cốt lõi:** Tuyệt đối KHÔNG phân tích và viết responsive thủ công theo từng màn hình riêng lẻ (Ad-hoc). Mọi màn hình ERP mới **BẮT BUỘC** phải kế thừa 100% từ Kiến trúc Responsive 3 Tầng sau:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: GLOBAL SHELL & LAYOUT (Khung bao hệ thống tự động co giãn)     │
│  - Tự lo Sidebar (256px -> 64px -> Drawer 0px trên mobile)             │
│  - Tự lo Container Max-Width (1700px), Global Viewport Padding         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Kế thừa 100%
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TẦNG 2: 4 MẪU HÌNH TRANG ERP CHUẨN HÓA (Page Archetypes)               │
│  1. [List Page Archetype]     -> Header + Filter Toolbar + Data Table  │
│  2. [Workspace Archetype]     -> Master-Detail (Báo giá, P&L, Đơn hàng)│
│  3. [Slide-over Drawer]       -> Xem nhanh hồ sơ (Full sheet on Mobile)│
│  4. [Modal Dialog Archetype]  -> Popup Form (95vw mobile -> 5xl 1024px)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Sử dụng lại
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TẦNG 3: BỘ UI PRIMITIVES DÙNG CHUNG (System Design Tokens & CSS Layers)│
│  - <FilterBarContainer> (Tự lo min-w-0, scrollbar-none, touch swipe)   │
│  - <TableContainer> (Tự lo overflow-x, sticky freeze, border)          │
│  - <ChipScrollRow> (Cuộn ngang chip an toàn không tràn khung mobile)   │
│  - <SearchInput> (Tự đệm !pl-10 !pr-9, tích hợp nút xóa X, chống đè)  │
│  - <FormGrid> (grid-cols-1 sm:2 md:3 lg:4)                             │
│  - <ResponsiveDrawer> (Slide-over drawer chuẩn 100% mobile -> 512px)   │
│  - <ModalDialog> (Modal form chuẩn kích thước lớn 2xl 1024px rộng rãi) │
│  - Input Base in @layer components (Không bao giờ bị đè icon)          │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Tầng 1: Global Shell & Layout (Trách nhiệm của Hệ Thống)
Mọi trang nghiệp vụ khi render bên trong `<ErpShell>` đều nghiễm nhiên được hưởng các đặc quyền responsive mà không cần viết thêm code:
1. **Sidebar State:**
   - **Desktop (>1440px):** Mở rộng 256px (`w-64`).
   - **Laptop (1024px – 1440px):** Hỗ trợ nút gập còn 64px (`w-16`), tự động nới rộng không gian làm việc thêm 192px cho các bảng dữ liệu nhiều cột.
   - **Mobile (<768px):** Tự động ẩn 100%, biến thành Drawer trượt từ cạnh trái, điều khiển bằng nút Hamburger.
2. **Safe Canvas:** Toàn bộ nội dung trang nằm trong thẻ `<main>` đã khóa sẵn `max-w-[1700px] mx-auto overflow-x-hidden p-4 md:p-6`. Trang không bao giờ bị dạt quá rộng trên màn hình 4K hay bị dính sát mép trên điện thoại.

### B. Tầng 2: Quy Chuẩn Hóa 4 "Mẫu Hình Trang" (Page Archetypes)
1. **Mẫu hình Danh Sách & Bảng (Data Grid Archetype):**
   - *Áp dụng cho:* Quản lý Địa điểm, Đối tác, Hàng hóa, Đội xe, Biểu giá mua, Danh sách báo giá.
   - *Quy tắc:*
     - Header: Tiêu đề bên trái, nút tác vụ bên phải $\rightarrow$ Mobile tự rớt dòng (`flex-wrap`).
     - Thanh lọc: Ô tìm kiếm Desktop tối đa 400px $\rightarrow$ Mobile giãn 100% full-width. Dãy chip phân loại nằm trong `<ChipScrollRow>` với `min-w-0 overflow-x-auto scrollbar-none` để vuốt cảm ứng ngang (*touch swipe*), không bao giờ làm rách khung trang.
     - Bảng dữ liệu: Bắt buộc bọc trong `<TableContainer>` với `overflow-x-auto` và `white-space: nowrap`. Tuyệt đối không cố bẻ dòng text để nhồi nhét vào màn hình điện thoại.
2. **Mẫu hình Soạn Thảo Nghiệp Vụ (Master-Detail Workspace Archetype):**
   - *Áp dụng cho:* Màn hình Soạn báo giá `/quotations/new`, Lệnh điều vận, Quản lý đơn hàng.
   - *Quy tắc:*
     - Desktop / Laptop: Bố cục 2 cột (Cột trái 65% là danh sách dịch vụ, cột phải 35% là tóm tắt tài chính P&L / Margin cố định theo viewport).
     - Mobile / Tablet: Tự động chuyển thành 1 cột dọc (Single Column) hoặc dạng Tabs (Tab 1: Soạn dịch vụ $\leftrightarrow$ Tab 2: Tóm tắt P&L & Nút duyệt).
3. **Mẫu hình Ngăn Kéo Tra Cứu Nhanh (Slide-over Drawer Archetype):**
   - *Áp dụng cho:* Xem chi tiết Địa điểm, Lịch sử đối tác, Chi tiết bảng giá.
   - *Quy tắc:* Bắt buộc dùng `<ResponsiveDrawer>`. Desktop/Laptop: trượt từ cánh phải với độ rộng 512px (`max-w-lg`). Mobile (< 768px): tự động mở rộng 100% chiều rộng màn hình (`w-full`) thành Bottom/Full Sheet.
4. **Mẫu hình Hộp Thoại (Modal Form Dialog Archetype):**
   - *Áp dụng cho:* Thêm nhanh đối tác, Chỉnh sửa địa điểm, Hộp thoại tạo mới biểu cước, Chỉnh sửa mặt hàng.
   - *Quy tắc:* Kế thừa component chuẩn `<ModalDialog size="2xl">` từ `@/components/ui/modal-dialog`. Kích thước mặc định chuẩn ERP là `w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto` (1024px trên Desktop), tạo không gian thoáng rộng, dễ quan sát, không bị chen chúc dữ liệu. Các trường nhập liệu trong form bắt buộc bọc trong `<FormGrid cols={2}>` hoặc `<FormGrid cols={3}>`.

### C. Tầng 3: Bộ UI Primitives & Design Tokens Toàn Cục
Bắt buộc dùng bộ component dùng chung từ `@/components/ui/list-page`, `@/components/ui/form`, `@/components/ui/responsive-drawer` và `@/components/ui/modal-dialog`:
- `<SearchInput>`
- `<FilterBarContainer>` (hoặc `<FilterToolbar>`)
- `<ChipScrollRow>`
- `<TableContainer>`
- `<FormGrid>`
- `<ResponsiveDrawer>`
- `<ModalDialog>` (Size mặc định 2xl: 1024px rộng rãi cho toàn bộ ERP)

### D. Quy Trình Viết Màn Hình Mới Chuẩn 5 Phút
Mọi trang danh sách mới bắt buộc tuân theo mẫu khung sau:
```tsx
export default function FeaturePage() {
  return (
    <div className="space-y-4">
      {/* 1. Header chuẩn: Đã tự responsive rớt dòng trên mobile */}
      <PageHeader title="Quản lý Hóa Đơn" actions={<Button>Tạo mới</Button>} />

      {/* 2. Toolbar chuẩn: Tự co giãn input và tự cuộn ngang chips */}
      <FilterToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." />
        <ChipScrollRow label="Trạng thái" icon={Filter}>
          {/* Danh sách buttons / chips */}
        </ChipScrollRow>
      </FilterToolbar>

      {/* 3. Bảng chuẩn: Tự cuộn ngang mượt mà, không vỡ layout */}
      <TableContainer ariaLabel="Bảng dữ liệu">
        <table className="erp-table">
          {/* Dữ liệu hiển thị */}
        </table>
      </TableContainer>
    </div>
  );
}
```

---

## 3. Tiêu Chuẩn Component Dùng Chung Bắt Buộc (UI Primitives)
Khi tạo màn hình hoặc chỉnh sửa giao diện, Agent **BẮT BUỘC** phải ưu tiên sử dụng các thành phần sau thay vì tự dựng HTML thô:

### A. Quản lý Danh Sách & Bảng Dữ Liệu (List Pages)
- **Header trang:** Sử dụng `<PageHeader title="..." subtitle="..." actions={...} />` từ `@/components/ui/list-page`.
- **Thanh lọc & Tìm kiếm Responsive:** Bắt buộc dùng bộ primitive từ `@/components/ui/list-page`:
  - Khung thanh lọc: `<FilterBarContainer> ... </FilterBarContainer>`.
  - Ô tìm kiếm chuẩn: `<SearchInput value={search} onChange={setSearch} placeholder="..." />` (tự động căn icon kính lúp, đệm padding an toàn `!pl-10 !pr-9`, nút xóa `X` tự động).
  - Dãy chip phân loại cuộn ngang mobile: `<ChipScrollRow label="..." icon={...}> ... </ChipScrollRow>` (tự động xử lý `min-w-0 max-w-full overflow-x-auto scrollbar-none`, vuốt cảm ứng mượt mà trên điện thoại mà không làm tràn khung).
- **Khung chứa bảng dữ liệu (Table Container):** Bắt buộc bọc bảng trong `<TableContainer ariaLabel="..."> <table className="erp-table">...</table> </TableContainer>` từ `@/components/ui/list-page` (tự động xử lý bo góc, viền và thanh cuộn ngang `overflow-x-auto scrollbar-thin` trên Mobile/Laptop).
- **Bộ nhớ đệm & Tải dữ liệu:** Sử dụng hook `const { loading, error, runLoad } = useListFeedback("cache_key")` từ `@/components/ui/list-page` để tận dụng cơ chế RAM Cache / SWR (Stale-While-Revalidate).
- **Phản hồi trạng thái bảng:** Sử dụng `<TableFeedback columns={N} loading={loading} error={error} onRetry={loadFn} />`.
- **Phân trang:** Sử dụng `<Pagination pagination={pagination} ... />` từ `@/components/ui/list-page`.
- **Trạng thái Rỗng (Empty State):** Khi danh sách không có dữ liệu hoặc tìm kiếm không khớp, **BẮT BUỘC** dùng `<EmptyState title="..." description="..." action={...} />` từ `@/components/ui/empty-state`. Tuyệt đối không để một dòng text đơn sơ `Không có dữ liệu`.

### B. Nhập Liệu Nghiệp Vụ Logistics
- **Tiền tệ (VND, USD):** Dùng `<CurrencyInput value={...} onChange={...} />` từ `@/components/ui/currency-input` (tự động phân cách hàng nghìn tiếng Việt, chặn ký tự lỗi).
- **Số lượng (Tấn, Teus, Lô hàng):** Dùng `<QuantityInput value={...} onChange={...} />` từ `@/components/ui/currency-input`.
- **Nút bấm:** Sử dụng `<Button variant="..." size="...">` từ `@/components/ui/button`.
- **Hộp thoại xác nhận hành động nguy hiểm:** Dùng `<ConfirmDialog ... />` từ `@/components/ui/confirm-dialog`.
- **Huy hiệu trạng thái:** Dùng `<StatusBadge status={code} />` từ `@/components/ui/status-badge`.

### C. Phản Hồi Tác Vụ (Toast Notifications)
- Mọi thao tác Thêm, Sửa, Xoá, Phê duyệt, Đăng nhập, Lưu nháp **BẮT BUỘC** dùng `toast` từ `sonner`:
  - Thành công: `toast.success("Nội dung thành công")`
  - Thất bại: `toast.error("Nội dung lỗi chi tiết")`
  - Đang xử lý: `toast.loading("Đang lưu...")`
- **Điều cấm kỵ:** Tuyệt đối không sử dụng `window.alert()`, `confirm()`, hoặc dòng text đỏ đơn lẻ không đồng bộ.

### D. Xuất Báo Cáo Excel
- Bất kỳ tính năng xuất dữ liệu bảng tính nào phải gọi qua module chuẩn `@/shared/utils/excel`:
  - `exportQuotationToExcel`: Xuất chi tiết hồ sơ báo giá.
  - `exportRoadRatesToExcel`: Xuất biểu cước giá mua đường bộ.
  - Nếu có phân hệ mới, viết thêm hàm xuất tương ứng trong `src/shared/utils/excel.ts` với cùng chuẩn thiết kế header Navy THILOGI.

### E. Kiểm Soát Phân Quyền (RBAC)
- Các nút hành động nhạy cảm (Tạo báo giá, Duyệt cước, Đổi hạn mức nợ) phải được bọc trong `<Can action="...">` hoặc kiểm tra quyền qua hook `usePermission(actor)`.

### F. Quản Lý Form & Nhập Liệu (Form Architecture)
- **Form Primitives:** Sử dụng bộ component chuẩn từ `@/components/ui/form`: `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`, `<FormError>`.
- **Inline Validation:** Bắt buộc hiển thị thông báo lỗi validate của Zod / RHF ngay dưới chân từng ô nhập liệu (Inline error) kèm viền đỏ nổi bật.
- **Tự động làm sạch lỗi:** Khi người dùng sửa dữ liệu trong ô, thông báo lỗi inline tại ô đó phải được tự động xóa bỏ.

### G. Vòng Đời & Điều Hướng App Router (Lifecycle & Metadata)
- **Streaming & Skeletons:** Mọi route phân hệ phải có hoặc kế thừa `loading.tsx` với skeleton shimmer animation (`@/components/ui/skeleton`), triệt tiêu độ trễ thị giác (Zero-perceived latency).
- **Trang 404:** Sử dụng `not-found.tsx` chuẩn nhận diện thương hiệu THILOGI, luôn có nút dẫn về trang chủ nghiệp vụ.
- **Bảo Vệ Biên (Edge Protection):** Mọi route ERP bảo mật mới bắt buộc phải được khai báo trong `src/middleware.ts` để chặn request trái phép ngay từ tầng Edge trước khi render.
- **Tiêu đề Tab Động (Dynamic Metadata):** Các trang phải sử dụng hook `useDocumentTitle("Tên trang")` từ `@/shared/hooks/use-document-title` để cập nhật tiêu đề tab trình duyệt, hỗ trợ nhân viên mở nhiều tab làm việc song song.

### H. Bộ Chọn Ngày Chuẩn Hóa (DatePicker)
- Mọi trường chọn ngày tháng nghiệp vụ (Hiệu lực giá, ngày lập báo giá, ngày giao hàng) **BẮT BUỘC** dùng `<DatePicker />` từ `@/components/ui/date-picker`:
  - Định dạng hiển thị chuẩn Việt Nam: `dd/MM/yyyy`.
  - Giá trị lưu trữ chuẩn ISO: `YYYY-MM-DD`.
  - Hỗ trợ các phím chọn nhanh: Hôm nay, 7 ngày tới, 30 ngày tới, Cuối tháng.
  - **Điều cấm kỵ:** Tuyệt đối không dùng thẻ `<input type="date">` thô của trình duyệt.

### I. Quản Trị & Import Dữ Liệu Excel (Data Ingestion)
- Mọi luồng xuất và nhập dữ liệu Excel phải thông qua module `@/shared/utils/excel.ts`:
  - Xuất báo cáo: `exportQuotationToExcel`, `exportRoadRatesToExcel`.
  - Nhập hàng loạt: `parseRoadRatesFromExcel` kết hợp Server Action có transaction rollback và trả về báo cáo lỗi chi tiết từng dòng.

### J. Giám Sát Mạng & Khả Năng Ngoại Tuyến (Offline Resilience)
- Shell hệ thống (`ErpShell`) bắt buộc tích hợp `<NetworkStatusBanner />` sử dụng `useSyncExternalStore` của React 19 để cảnh báo người dùng ngay khi mất kết nối Internet, tránh mất dữ liệu khi đang soạn thảo.

### K. Kiến Trúc Quản Lý State (Right Tool for the Right State)
- **Tầng 1 - Server State (85% dữ liệu ERP):** PostgreSQL + Server Actions + RAM Cache SWR (`useListFeedback`).
  - **Điều cấm kỵ:** Tuyệt đối KHÔNG đưa dữ liệu server (Bảng giá, Địa điểm, Khách hàng, Đội xe) vào Redux / Global Client Store để tránh lỗi State Duplication và Cache Drift.
- **Tầng 2 - URL State (10% trạng thái):** Mọi bộ lọc, tìm kiếm, phân trang bắt buộc đồng bộ trên URL search params (`?search=...&page=...`) để nhân viên chia sẻ liên kết hoặc F5 không mất dữ liệu.
- **Tầng 3 - Form State:** Quản lý bằng `react-hook-form` + `zod` + `react-number-format` (Uncontrolled, cô lập re-render, inline validation).
- **Tầng 4 - Auth State:** Quản lý qua HTTP-only JWT Cookie bảo mật (`jose`), xác thực tại Edge/Middleware, không lưu token trong local storage hay client store.
- **Tầng 5 - Transient UI State:** Modal, drawer, tooltip dùng `useState` cục bộ và Radix UI primitives.
- **Quy chuẩn Redux & Zustand:**
  - **CẤM** cài đặt Redux / Redux Toolkit vào Next.js 16 App Router (làm phình to bundle JS, xung đột Server Components).
  - Khi thực sự có nhu cầu lưu trữ client state liên màn hình (ví dụ: khay gom cước tạm, danh sách hàng đợi ngoại tuyến), **BẮT BUỘC** dùng `zustand` (1KB, không cần Provider bọc ngoài).

### L. Quy Chuẩn Tổ Chức Component Liền Kề (Colocation Pattern - Chống God Component)
- Khi một file `page.tsx` phình to quá 150 dòng và ôm đồm nhiều nhiệm vụ (Bảng, Modal Form, Slide-over Drawer, Confirm Dialogs):
  - **BẮT BUỘC** tách thành thư mục private `_components/` nằm ngay bên cạnh `page.tsx`:
    - `_components/[feature]-table.tsx`
    - `_components/[feature]-filter-bar.tsx`
    - `_components/[feature]-detail-drawer.tsx`
    - `_components/[feature]-form-dialog.tsx`
  - Thư mục có tiền tố `_` được Next.js bảo vệ (Private Folders), không bị biến thành route URL.
  - File `page.tsx` chỉ giữ vai trò Orchestrator (dưới 100 dòng), điều phối state và kết nối các sub-components.

### M. Bộ Thư Viện Chuyên Biệt Mới Cho Logistics ERP
- **Biểu đồ sản lượng & Tài chính (`recharts`):**
  - Mọi dashboard thống kê sản lượng TEUs, doanh thu cước, tỷ lệ sử dụng đội xe phải dựng bằng `recharts`.
- **Bản đồ số vệ tinh (`leaflet` + `@types/leaflet`):**
  - Giám sát vị trí 160 kho bãi, cảng biển, cửa khẩu Đông Dương hiển thị trực quan bằng bản đồ Leaflet OpenStreetMap (mã nguồn mở, 0 chi phí API).
- **Thanh lệnh điều hướng nhanh (`cmdk`):**
  - Kích hoạt bằng `Ctrl + K` / `Cmd + K` để nhân viên tra cứu nhanh báo giá `#BG-...`, mã kho hoặc nhà xe.
- **In ấn & Xuất PDF (`react-to-print`):**
  - Dùng cho tác vụ in ấn trực tiếp từ trình duyệt đối với Báo giá, Lệnh điều vận, Phiếu bàn giao hàng hóa.
- **Tìm kiếm Tiếng Việt Không Dấu (Accent-Insensitive Search):**
  - Mọi thanh tìm kiếm client-side bắt buộc tích hợp hàm chuẩn hóa `removeVietnameseTones()`, đảm bảo gõ có dấu hay không dấu (ví dụ: `bac ninh` hay `Bắc Ninh`) đều tìm thấy kết quả 100%.

---

## 3. Quy Trình Kiểm Tra Bắt Buộc Trước Khi Hoàn Thành (Definition of Done)
1. **Kiểm tra tĩnh:** Chạy `npm run check` (`tsc --noEmit && eslint`) -> 100% **0 errors, 0 warnings**.
2. **Kiểm tra hồi quy:** Chạy `npm test` -> 100% **60/60 tests pass**.
3. **Báo cáo bắt buộc:** Luôn có mục **"🛡️ Đánh giá Tác động Chéo & Vùng Lân Cận"** tuân theo Universal Code Reviewer & Impact Protocol.

