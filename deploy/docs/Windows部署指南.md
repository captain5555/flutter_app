# Windows 部署指南

## 系统要求

- Windows 10/11 或 Windows Server 2016+
- 至少 2GB 可用内存
- 至少 1GB 可用磁盘空间（不含素材）

## 快速部署

### 1. 解压离线包
将下载的压缩包解压到你想安装的位置，例如：
```
C:\nas-material-manager\
```

### 2. 一键安装
进入解压后的文件夹，双击运行：
```
deploy\windows\一键安装.bat
```

脚本会自动：
- 检查 Node.js（如未安装会提示）
- 检查依赖包
- 创建数据目录

### 3. 启动系统
双击运行：
```
deploy\windows\启动系统.bat
```

### 4. 访问系统
打开浏览器访问：
```
http://localhost:3001
```

---

## 作为后台服务运行（可选）

### 使用 NSSM 安装为 Windows 服务

1. 下载 NSSM: https://nssm.cc/download
2. 解压到 `C:\nssm\`
3. 以管理员身份运行命令提示符：
```cmd
cd C:\nssm\win64
nssm install "NAS素材管理系统"
```

4. 在弹出的窗口中配置：
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\nas-material-manager\backend`
   - Arguments: `src/server.js`

5. 点击 "Install service"

6. 在服务管理器中启动服务

---

## 防火墙配置

如需从其他设备访问，需要开放端口 3001：

```cmd
# 以管理员身份运行命令提示符
netsh advfirewall firewall add rule name="NAS素材管理系统" dir=in action=allow protocol=TCP localport=3001
```

---

## 数据目录

所有数据存储在 `backend\data\` 目录：
- `db\` - 数据库文件
- `uploads\` - 上传的素材
- `backups\` - 自动备份
- `temp\` - 临时文件

**建议定期备份整个 `data\` 目录！**

---

## 常见问题

### Q: 提示 Node.js 未安装？
A: 访问 https://npmmirror.com/mirrors/node/ 下载 Node.js 18 LTS 安装

### Q: 如何修改端口？
A: 编辑 `backend\.env` 文件，修改 `PORT=3001`

### Q: 如何开机自启？
A: 将 "启动系统.bat" 的快捷方式放到启动文件夹：
   `C:\Users\你的用户名\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`
