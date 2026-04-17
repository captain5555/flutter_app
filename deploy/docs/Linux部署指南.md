# Linux 部署指南

## 系统要求

- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 至少 1GB 可用内存
- 至少 1GB 可用磁盘空间（不含素材）

## 快速部署

### 1. 上传项目文件
使用 SCP/SFTP 或其他方式上传整个项目到服务器：
```bash
# 示例：使用 scp 上传
scp -r nas-material-manager-v3.zip user@your-server:/opt/
```

在服务器上解压：
```bash
cd /opt
unzip nas-material-manager-v3.zip
cd nas-material-manager-v3
```

### 2. 设置权限
```bash
chmod +x deploy/linux/*.sh
```

### 3. 一键安装
```bash
./deploy/linux/install.sh
```

脚本会自动：
- 检查 Node.js（如未安装会提示）
- 检查依赖包
- 创建数据目录
- 设置权限

### 4. 启动系统
```bash
# 前台运行（调试用）
./deploy/linux/start.sh

# 后台运行（推荐）
nohup ./deploy/linux/start.sh > system.log 2>&1 &
```

### 5. 访问系统
打开浏览器访问：
```
http://你的服务器IP:3001
```

---

## 使用 systemd 配置开机自启

### 1. 创建服务文件
```bash
sudo nano /etc/systemd/system/nas-material-manager.service
```

### 2. 粘贴以下内容
```ini
[Unit]
Description=NAS Material Manager V3
After=network.target

[Service]
Type=simple
User=你的用户名
WorkingDirectory=/opt/nas-material-manager-v3/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

# 环境变量
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 3. 启用并启动服务
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable nas-material-manager

# 启动服务
sudo systemctl start nas-material-manager

# 查看状态
sudo systemctl status nas-material-manager

# 查看日志
sudo journalctl -u nas-material-manager -f
```

---

## 防火墙配置

### Ubuntu/Debian (ufw)
```bash
sudo ufw allow 3001/tcp
```

### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

## 使用 Nginx 反向代理（可选）

### 1. 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 创建配置文件
```bash
sudo nano /etc/nginx/sites-available/nas-material-manager
```

### 3. 粘贴以下内容
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /opt/nas-material-manager-v3/backend/data/uploads/;
        expires 30d;
    }
}
```

### 4. 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/nas-material-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 数据备份

### 手动备份
```bash
# 备份整个 data 目录
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/
```

### 自动备份 cron 任务
```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * cd /opt/nas-material-manager-v3 && tar -czf backups/backup-$(date +\%Y\%m\%d).tar.gz backend/data/ && find backups/ -name "backup-*.tar.gz" -mtime +7 -delete
```

---

## 常见问题

### Q: 如何查看运行日志？
```bash
# 查看系统日志
tail -f system.log

# 如果使用 systemd
sudo journalctl -u nas-material-manager -f
```

### Q: 如何停止系统？
```bash
# 如果是前台运行，按 Ctrl+C

# 如果是后台运行
./deploy/linux/stop.sh

# 或者使用 systemd
sudo systemctl stop nas-material-manager
```

### Q: 如何修改端口？
A: 编辑 `backend/.env` 文件，修改 `PORT=3001`，然后重启系统
