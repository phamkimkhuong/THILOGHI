#!/usr/bin/env bash
# ====================================================================
# THILOGI Web Logistics Operating Platform
# Script: setup-vps.sh
# Mục đích: Tự động cài đặt Docker, Docker Compose, Git, Nginx và bảo mật VPS Ubuntu/Debian
# ====================================================================

set -e

echo "=========================================================="
echo "🚀 [THILOGI VPS SETUP] Bắt đầu thiết lập môi trường máy chủ"
echo "=========================================================="

# 1. Cập nhật hệ điều hành
echo ">>> [1/6] Cập nhật danh sách gói hệ thống..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop net-tools ca-certificates gnupg lsb-release

# 2. Cài đặt Docker Engine & Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    echo ">>> [2/6] Đang cài đặt Docker chính thức..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Phân quyền cho user hiện tại chạy docker không cần sudo
    sudo usermod -aG docker $USER
    echo "✅ Docker đã được cài đặt thành công!"
else
    echo "✅ Docker đã tồn tại trên máy chủ."
fi

# 3. Kích hoạt và kiểm tra Docker Service
sudo systemctl enable docker
sudo systemctl start docker

# 4. Cấu hình Tường lửa (UFW Firewall)
echo ">>> [3/6] Cấu hình tường lửa UFW..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Caddy'
sudo ufw allow 443/tcp comment 'HTTPS Caddy'
# Không mở port 5432 và port 3000 ra ngoài (chỉ cho phép truy cập nội bộ qua Docker & Caddy Reverse Proxy)
sudo ufw --force enable
sudo ufw status verbose

# 5. Khởi tạo thư mục triển khai ứng dụng
echo ">>> [4/6] Khởi tạo thư mục triển khai /var/www/thilogi..."
sudo mkdir -p /var/www/thilogi
sudo chown -R $USER:$USER /var/www/thilogi

# 6. Cài đặt Caddy Web Server (Tự động cấp chứng chỉ HTTPS / SSL)
echo ">>> [5/6] Cài đặt Caddy Web Server..."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Kích hoạt dịch vụ Caddy
sudo systemctl enable caddy
sudo systemctl start caddy

# Sao chép Caddyfile mẫu nếu có
if [ -f "/var/www/thilogi/deploy/caddy/Caddyfile" ]; then
    echo ">>> [6/6] Áp dụng cấu hình Caddyfile..."
    sudo cp /var/www/thilogi/deploy/caddy/Caddyfile /etc/caddy/Caddyfile
    sudo systemctl reload caddy
fi

echo "=========================================================="
echo "🎉 THIẾT LẬP VPS VỚI CADDY HOÀN TẤT!"
echo "Điểm mạnh của Caddy: Tự động cấp và gia hạn SSL (HTTPS) 100% không cần Certbot!"
echo "Bước tiếp theo:"
echo "1. Thêm SSH Key của VPS vào GitHub Secrets (VPS_HOST, VPS_USERNAME, VPS_SSH_KEY, VPS_PORT)"
echo "2. Khi có tên miền (vd: erp.thilogi.vn), bạn chỉ cần mở /etc/caddy/Caddyfile, thay ':80' bằng 'erp.thilogi.vn' và chạy 'sudo systemctl reload caddy' là có HTTPS tự động!"
echo "=========================================================="
