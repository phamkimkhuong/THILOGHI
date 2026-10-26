# Hướng Dẫn CI/CD Triển Khai THILOGI Lên VPS (Đã Có Sẵn Docker & Caddy)

Vì máy chủ VPS của bạn **đã được cài đặt sẵn Docker, Docker Compose và Caddy**, quá trình thiết lập CI/CD tự động hóa sẽ cực kỳ nhanh gọn và tinh gọn.

---

## 1. Cơ Chế Hoạt Động Của CI/CD Pipeline

```
[ Bạn Git Push ] ──► [ GitHub Actions ] ──(SSH)──► [ VPS của Bạn ]
(nhánh main)          1. Kiểm tra TypeScript        1. Kéo code mới về
                      2. Kiểm tra ESLint            2. Docker compose up -d --build
                      3. Thử nghiệm Build           3. Kiểm tra /api/health
                      (Chỉ deploy khi 0 lỗi)        4. Caddy tự động phục vụ ra ngoài
```

---

## 2. Bước 1: Thêm Cấu Hình Reverse Proxy Vào Caddy Hiện Có Trên VPS

Trên VPS của bạn, mở file `Caddyfile` đang hoạt động (thường ở `/etc/caddy/Caddyfile`):

```bash
sudo nano /etc/caddy/Caddyfile
```

Thêm khối cấu hình sau (thay `erp.thilogi.vn` bằng tên miền hoặc cổng `:80` nếu chỉ dùng IP):

```caddy
erp.thilogi.vn {
    reverse_proxy 127.0.0.1:3000
    encode gzip zstd
    request_body {
        max_size 50MB
    }
}
```

Sau đó reload Caddy để nhận cấu hình:
```bash
sudo systemctl reload caddy
```
*(Nếu là tên miền thực tế đã trỏ IP, Caddy sẽ tự động cấp chứng chỉ HTTPS / SSL hoàn toàn miễn phí ngay lập tức).*

---

## 3. Bước 2: Thêm GitHub Secrets Để Cấp Quyền SSH Cho GitHub Actions

Nếu bạn chưa có SSH Key cho GitHub Actions, tạo nhanh trên VPS:
```bash
ssh-keygen -t ed25519 -C "github-actions-thilogi" -f ~/.ssh/github_actions_key -N ""
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_key   # Copy toàn bộ nội dung Private Key
```

Vào GitHub: **Settings -> Secrets and variables -> Actions -> New repository secret** và thêm:

| Tên Secret | Bắt Buộc | Giá Trị |
| :--- | :---: | :--- |
| `VPS_HOST` | **Có** | IP công khai của VPS (vd: `103.xxx.xxx.xxx`) |
| `VPS_USERNAME` | **Có** | Tên user SSH (vd: `root` hoặc `ubuntu`) |
| `VPS_SSH_KEY` | **Có** | Toàn bộ nội dung Private Key vừa copy ở trên |
| `VPS_PORT` | Không | Cổng SSH (mặc định `22`) |
| `VPS_DEPLOY_DIR` | Không | Thư mục đặt dự án trên VPS (mặc định `/var/www/thilogi`) |
| `POSTGRES_PASSWORD` | Không | Mật khẩu database production (mặc định trong compose: `thilogi_secure_2026`) |
| `JWT_SECRET` | Không | Khóa bí mật JWT (mặc định trong compose: `thilogi_super_secure_jwt_secret_key_2026_production`) |

---

## 4. Bước 3: Đẩy Code Lên GitHub Để Deploy Tự Động!

Chạy lệnh commit và push:
```bash
git add .
git commit -m "feat(ci-cd): configure GitHub Actions automated deployment for existing VPS"
git push origin main
```

Từ thời điểm này, tab **Actions** trên GitHub sẽ tự động:
1. Chạy test `npm run typecheck`, `npm run lint`, `npm run build`.
2. Tự động SSH vào VPS kéo code về thư mục deployment.
3. Chạy `docker compose up -d --build`.
4. Gọi `/api/health` xác nhận ứng dụng và cơ sở dữ liệu đã sẵn sàng hoạt động!
