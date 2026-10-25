# TÀI LIỆU TIÊU CHUẨN AN NINH & BẢO MẬT CƠ SỞ DỮ LIỆU POSTGRESQL TRÊN VPS
## HỆ THỐNG QUẢN TRỊ VẬN HÀNH LOGISTICS THILOGI (RELEASE 1)

---

> **MỤC TIÊU TÀI LIỆU:**  
> Thiết lập bộ quy chuẩn an toàn, phòng ngừa rò rỉ dữ liệu thương mại (Bảng giá BUY/SELL, Khách hàng, Doanh thu, P&L) và đảm bảo tính sẵn sàng cao (High Availability) cho CSDL PostgreSQL khi triển khai trên môi trường máy chủ ảo (VPS/Cloud) của THILOGI.

---

## 1. NGUYÊN TẮC CỐT LÕI: PHÒNG THỦ CHIỀU SÂU (DEFENSE-IN-DEPTH)

```
[INTERNET]
    │
    ▼ (Chỉ cho phép Cổng 80/443 qua Tường lửa UFW)
┌────────────────────────────────────────────────────────┐
│ MÁY CHỦ VPS THILOGI (Ubuntu / Debian Linux)            │
│                                                        │
│   ┌─────────────────────┐      ┌───────────────────┐   │
│   │   Next.js App       │ ───► │  PostgreSQL 16    │   │
│   │   (Port 3000)       │      │  (Port 5432)      │   │
│   └─────────────────────┘      └───────────────────┘   │
│              ▲                           ▲             │
│              │ (Localhost / Docker)      │             │
│   [Cấm truy cập Public]       [Cấm Public 5432/TCP]    │
└────────────────────────────────────────────────────────┘
```

---

## 2. NGUYÊN TẮC 1: CÁCH LY MẠNG & THIẾT LẬP TƯỜNG LỬA (NETWORK ISOLATION)

### 2.1. Đóng Triệt Để Cổng 5432 Ra Môi Trường Internet
- **Rủi ro:** Cổng 5432 nếu mở công khai (`0.0.0.0/0`) sẽ trở thành mục tiêu bị quét tự động bởi các botnet và tấn công dò mật khẩu (Brute-force attack), nguy cơ lộ toàn bộ báo giá và hợp đồng khách hàng.
- **Quy chuẩn:** CSDL PostgreSQL **CHỈ ĐƯỢC PHÉP** lắng nghe trên địa chỉ nội bộ `127.0.0.1` (Localhost) hoặc dải mạng Private Docker Network (`thilogi-network`).

### 2.2. Cấu Hình Tường Lửa UFW (Uncomplicated Firewall)
Thực thi các lệnh sau trên terminal của VPS:
```bash
# 1. Chặn toàn bộ kết nối đến mặc định, cho phép toàn bộ kết nối đi
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Mở cổng quản trị SSH (Khuyến nghị đổi cổng 22 thành cổng bảo mật khác nếu có thể)
sudo ufw allow 22/tcp

# 3. Mở cổng Web Public (HTTP & HTTPS)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. CHẶN RÕ RÀNG CỔNG 5432 TỪ INTERNET
sudo ufw deny 5432/tcp

# 5. Kích hoạt tường lửa và kiểm tra trạng thái
sudo ufw enable
sudo ufw status verbose
```

### 2.3. Cấu Hình Ràng Buộc Địa Chỉ Lắng Nghe Trong `postgresql.conf`
Nếu cài PostgreSQL trực tiếp trên VPS, mở file cấu hình `/etc/postgresql/16/main/postgresql.conf`:
```ini
# Chỉ lắng nghe kết nối nội bộ từ chính máy chủ
listen_addresses = 'localhost'
port = 5432
```

### 2.4. Xác Thực Nghiêm Ngặt Trong `pg_hba.conf`
Mở file `/etc/postgresql/16/main/pg_hba.conf` và áp dụng phương thức mã hóa SCRAM-SHA-256 (Cấm tuyệt đối dùng `trust` hoặc `md5` cũ):
```ini
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

---

## 3. NGUYÊN TẮC 2: QUẢN TRỊ TÀI NGUYÊN & CHỐNG SẬP MÁY CHỦ (RESOURCE HARDENING)

### 3.1. Thiết Lập Bộ Nhớ Đệm Ảo (Swap Memory 4GB)
- **Rủi ro:** Khi chạy đồng thời Next.js và PostgreSQL trên 1 VPS (đặc biệt các gói VPS 2GB - 4GB RAM), khi ứng dụng biên dịch hoặc thực hiện truy vấn đối soát P&L nặng, hệ điều hành Linux sẽ kích hoạt tiến trình **OOM Killer (Out Of Memory Killer)** và tự động tắt ngẫu nhiên service `postgres` hoặc `node`.
- **Giải pháp:** Bắt buộc tạo phân vùng Swap $4\text{GB}$ để làm vùng đệm an toàn:
```bash
# 1. Tạo file swap 4GB
sudo fallocate -l 4G /swapfile

# 2. Phân quyền chỉ người dùng root được đọc/ghi
sudo chmod 600 /swapfile

# 3. Định dạng và kích hoạt Swap
sudo mkswap /swapfile
sudo swapon /swapfile

# 4. Lưu cấu hình vĩnh viễn vào /etc/fstab để tự bật khi khởi động lại
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 5. Tối ưu độ ưu tiên sử dụng swap (giảm swappiness để ưu tiên RAM thật)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 3.2. Giới Hạn Connection Pool Phía Ứng Dụng Next.js
Để tránh tình trạng mỗi request mở 1 kết nối làm cạn kiệt RAM của PostgreSQL, file `src/server/db/index.ts` của ứng dụng đã được khóa cứng ngưỡng kết nối:
```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Tối đa 20 connections đồng thời
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

---

## 4. NGUYÊN TẮC 3: QUẢN TRỊ DANH TÍNH & BÍ MẬT (CREDENTIALS & SECRETS)

### 4.1. Không Dùng Quyền Superuser `postgres` Cho Ứng Dụng
- Tạo user riêng cho ứng dụng web với quyền hạn giới hạn đúng trong CSDL `thilogi_db`:
```sql
-- Tạo User riêng cho Web App
CREATE USER thilogi_app WITH PASSWORD 'Chuoi_Mat_Khau_Ngau_Nhien_Tren_24_Ky_Tu!@#';

-- Chỉ cấp quyền trên CSDL thilogi_db, không cho quyền tạo Superuser/Database khác
GRANT ALL PRIVILEGES ON DATABASE thilogi_db TO thilogi_app;
```

### 4.2. Bảo Mật File Biến Môi Trường `.env.local`
- **Quy tắc 1:** File `.env.local` chứa thông tin mật khẩu kết nối `DATABASE_URL` bắt buộc phải nằm trong `.gitignore` (Tuyệt đối không commit lên Git public hoặc shared repo).
- **Quy tắc 2:** Phân quyền chặt chẽ trên VPS:
```bash
# Chỉ user sở hữu được quyền đọc file env
chmod 600 /var/www/thilogi/.env.local
```

---

## 5. NGUYÊN TẮC 4: CHIẾN LƯỢC SAO LƯU DỰ PHÒNG TỰ ĐỘNG (BACKUP & DISASTER RECOVERY)

### 5.1. Kịch Bản Sao Lưu Tự Động Bằng `pg_dump`
Tạo file script backup tại `/opt/thilogi/backup-db.sh`:
```bash
#!/bin/bash
# Script tự động backup PostgreSQL cho THILOGI
BACKUP_DIR="/var/backups/thilogi_pg"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/thilogi_db_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

# Thực hiện dump CSDL và nén gzip
PGPASSWORD="thilogi_secure_2026" pg_dump -U thilogi_admin -h localhost thilogi_db | gzip > $BACKUP_FILE

# Phân quyền bảo mật file backup
chmod 600 $BACKUP_FILE

# Tự động dọn dẹp các bản backup cũ hơn 14 ngày để không làm đầy ổ cứng VPS
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -delete

echo "Backup hoàn tất: $BACKUP_FILE"
```

### 5.2. Lên Lịch Chạy Hằng Đêm Qua Cronjob
Mở crontab: `sudo crontab -e` và thêm dòng sau để backup vào lúc **02:00 sáng mỗi ngày**:
```cron
0 2 * * * /bin/bash /opt/thilogi/backup-db.sh >> /var/log/thilogi_backup.log 2>&1
```

---

## 6. NGUYÊN TẮC 5: PHÒNG CHỐNG TẤN CÔNG DÒ MẬT KHẨU (BRUTE-FORCE PROTECTION)

### 6.1. Cài Đặt Fail2ban Để Bảo Vệ Cổng SSH
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```
Fail2ban sẽ tự động khóa địa chỉ IP (Ban IP) trong vòng 1 giờ nếu nhập sai mật khẩu SSH quá 5 lần liên tiếp.

---

## BẢNG TỔNG KẾT CHECKLIST NGHIỆM THU AN NINH DATABASE TRƯỚC KHI GO-LIVE

| STT | Hạng Mục Kiểm Tra | Tiêu Chuẩn Đạt (Pass Criteria) | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **1** | Cổng PostgreSQL 5432 | Bị chặn từ ngoài Internet (`ufw status` xác nhận deny) |  |
| **2** | Listen Address | Chỉ lắng nghe `localhost` hoặc Docker network |  |
| **3** | Authentication Method | Dùng chuẩn mã hóa `scram-sha-256`, cấm `trust` |  |
| **4** | Phân vùng Swap | Đã tạo và kích hoạt $4\text{GB}$ Swap memory |  |
| **5** | Quyền hạn File `.env.local` | Được phân quyền `chmod 600`, đã thêm vào `.gitignore` |  |
| **6** | Extension `btree_gist` | Đã bật thành công trong `thilogi_db` |  |
| **7** | Kịch bản Auto Backup | Cronjob chạy dump hàng đêm, tự xóa sau 14 ngày |  |
| **8** | Chống Brute-force | Đã kích hoạt Fail2ban cho SSH |  |

---
*Tài liệu được ban hành và áp dụng cho Hệ sinh thái Web Logistics THILOGI - Chu Lai Open Economic Zone.*
