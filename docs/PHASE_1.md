# Đợt 1 — Củng cố danh mục và báo giá

## Thay đổi

- Bỏ suy luận hàng lạnh, hàng nguy hiểm và đơn vị “Tấn” khi nguồn dữ liệu chưa có các thuộc tính đó.
- Mở lại nháp giữ mã giá mua, NCC và cách tính phí của từng dòng. Thay tuyến hoặc thiết bị xóa lựa chọn giá cũ.
- Nút trình duyệt lưu dữ liệu đang nhập và chuyển trạng thái trong cùng một transaction; lỗi ở bất kỳ bước nào sẽ rollback toàn bộ.
- Mỗi lần sửa phải gửi revision do server trả về. Server khóa dòng báo giá, kiểm tra revision, trạng thái và vùng hiện có trước khi ghi. Các thao tác duyệt/từ chối/trả nháp cũng khóa dòng cha.
- Kiểm tra Zod trên server; tiền và tổng lợi nhuận được tính lại từ giá nguồn, không dùng các tổng do trình duyệt gửi.
- Danh sách/chi tiết báo giá kiểm tra vùng của người dùng. Lưu/trình cần vai trò thương mại; từ chối/trả nháp cần quản lý. Ma trận phê duyệt theo margin hiện có được giữ nguyên.
- Tra cứu và lưu dùng chung tập giá: APPROVED, còn hiệu lực, Partner và Vendor Role đều ACTIVE. Worst-case là giá cao nhất trong cùng tập này.
- Ngày nghiệp vụ là ngày hiện tại tại Asia/Ho_Chi_Minh. Không còn trộn UTC của trình duyệt với CURRENT_DATE của DB.
- Đơn giá VND và thành tiền từng dòng làm tròn đến đồng bằng Decimal ROUND_HALF_UP. Tổng cộng là tổng các dòng đã làm tròn. Snapshot mới lưu đơn giá quy đổi ở rate_amount_vnd, tương ứng với đơn giá gốc rate_amount.

## Đăng nhập và cấu hình

- Truy cập `/login`. Đăng nhập bằng username và mật khẩu khớp `users.password_hash` (bcrypt); tài khoản phải hoạt động.
- Không tạo tài khoản mặc định, không thay mật khẩu hoặc seed của khách hàng. Tài khoản chưa có password_hash cần được quản trị viên cấp mật khẩu trước khi dùng đăng nhập thông thường.
- `JWT_SECRET` bắt buộc có ít nhất 32 ký tự; Docker Compose không còn dùng khóa mặc định.
- `ENABLE_DEMO_AUTH=false` là mặc định. Chỉ đặt `true` trên môi trường thử nội bộ để chọn tài khoản không cần mật khẩu. Dù bật demo, hệ thống không tự chọn tài khoản đầu tiên.
- Biến `NEXT_PUBLIC_ENABLE_DEMO_AUTH` không còn quyết định giao diện; danh sách tài khoản thử được quyết định phía server.
- Đăng nhập có giới hạn 5 lần thử/tên đăng nhập/15 phút trong bộ nhớ mỗi tiến trình. Khi triển khai nhiều tiến trình cần thay bằng bộ đếm dùng chung.

## Dữ liệu và triển khai

- Không đổi schema, không chạy migration hoặc reset database trong đợt này.
- Tỷ giá vẫn là bảng cấu hình cố định đang có trong code, chưa phải tỷ giá cập nhật theo ngày.
- Không sửa snapshot của báo giá cũ. Trước thay đổi này rate_amount_vnd từng lưu thành tiền; màn hình chi tiết hiện tính đơn giá quy đổi từ đơn giá gốc và tỷ giá đã chụp, nên đọc được cả snapshot cũ và mới. Khi truy vấn trực tiếp trường rate_amount_vnd để làm báo cáo, cần đối chiếu dữ liệu cũ.
- Các thay đổi đang có của người dùng về hạn mức tín dụng được giữ lại.
- Khóa bất biến bằng trigger DB, phiên bản thương mại mới và giao diện các giai đoạn sau chưa thuộc đợt này.

## Kiểm tra

Chạy `npm test`, `npm run check`, `npm run build`.

Bộ test chạy code TypeScript thật với IO database được giả lập: kiểm tra phục hồi nháp, validation, quyền vùng/vai trò, làm tròn, ngày Việt Nam, transaction lưu–trình, rollback và session. Không thay thế kiểm thử tích hợp PostgreSQL hoặc thao tác đồng thời trên trình duyệt.

Kết quả kiểm tra ngày 27/10/2026: 29 ca hồi quy đạt. Build production chưa được xác nhận: lần đầu không tải được Google Fonts; lần chạy có truy cập mạng gặp lỗi Turbopack khi khởi tạo worker xử lý CSS (`node process exited before we could connect`). Chưa có PostgreSQL tại localhost:5432 để chạy UAT tích hợp; không kết nối hay thay đổi dữ liệu VPS.

Trên môi trường UAT có PostgreSQL, kiểm tra:

1. Đăng nhập Sales vùng A; không xem/sửa được báo giá vùng B kể cả gửi trực tiếp ID.
2. Lập nháp, chọn NCC, lưu; mở lại và sửa giá bán, giữ nguyên mã giá mua.
3. Đổi giá bán rồi bấm trình duyệt ngay: dữ liệu chờ duyệt phải chứa giá mới.
4. Mở cùng bản nháp trên hai cửa sổ; lưu cửa sổ thứ nhất rồi lưu cửa sổ thứ hai: cửa sổ thứ hai phải yêu cầu tải lại.
5. Trình khi thiếu giá/hết hiệu lực/NCC ngừng hoạt động: không tạo trạng thái chờ duyệt hoặc ghi một phần dữ liệu.
6. Duyệt bằng người có quyền độc lập; bản đã duyệt không sửa được qua màn hình hoặc action lưu.
7. Kiểm tra tài khoản không có phiên, cookie sai/hết hạn và tài khoản bị vô hiệu hóa: không truy cập được dữ liệu ERP.
