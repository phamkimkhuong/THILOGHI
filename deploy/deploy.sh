#!/usr/bin/env bash
set -e

# ====================================================================
# THILOGI PRODUCTION DEPLOYMENT SCRIPT
# Chạy tự động từ CI/CD hoặc chạy thủ công trực tiếp trên VPS
# ====================================================================

echo "=========================================================="
echo "🚀 [THILOGI DEPLOY] Bắt đầu quá trình triển khai hệ thống"
echo "Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"
echo "Thư mục làm việc: $PROJECT_DIR"

# 1. Kiểm tra sự tồn tại của tệp cấu hình bảo mật .env
echo ">>> [1/4] Kiểm tra tệp môi trường .env do người dùng quản lý..."
if [ ! -f .env ]; then
  echo "❌ LỖI BẢO MẬT: Không tìm thấy tệp .env trên máy chủ VPS!"
  echo "Để đảm bảo an toàn tuyệt đối, hệ thống KHÔNG tự động tạo file .env với mật khẩu mặc định."
  echo "Vui lòng tự tạo tệp .env tại thư mục: $PROJECT_DIR/.env (tham khảo mẫu tại .env.example) trước khi triển khai."
  exit 1
fi

chmod 600 .env
echo "✅ Đã tìm thấy tệp .env. Giữ nguyên toàn bộ cấu hình mật khẩu bảo mật người dùng đã thiết lập."

# 2. Khởi động lại Docker Containers
echo ">>> [2/4] Build và khởi chạy Docker Compose..."
docker compose down --remove-orphans || true
docker compose up -d --build

# 3. Kiểm tra trạng thái hoạt động (Healthcheck)
echo ">>> [3/4] Đang đợi hệ thống sẵn sàng và kiểm tra Healthcheck..."
sleep 10
docker compose ps

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
  echo "✅ Healthcheck THÀNH CÔNG (HTTP 200) - Hệ thống THILOGI đã sẵn sàng phục vụ!"
else
  echo "⚠️ Healthcheck trả về mã: $HEALTH_STATUS. Kiểm tra log ứng dụng:"
  docker compose logs --tail=40 app
fi

# 4. Dọn dẹp images cũ để tiết kiệm dung lượng ổ cứng VPS
echo ">>> [4/4] Dọn dẹp images cũ..."
docker image prune -f

echo "=========================================================="
echo "🎉 [THILOGI DEPLOY] Triển khai hoàn tất thành công!"
echo "Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="
