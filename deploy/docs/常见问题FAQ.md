# 常见问题 FAQ

## 部署相关

### Q: 离线包需要重新下载依赖吗？
A: 不需要！离线包已经包含了完整的 `node_modules`，直接解压就能用。

### Q: 可以把系统装在 U 盘或移动硬盘吗？
A: 可以！整个系统是绿色的，解压到哪里都能运行。

### Q: 如何从 V2 升级到 V3？
A:
1. 备份 V2 的 `data/` 目录
2. 安装 V3
3. 将 V2 的 `data/uploads/` 复制到 V3 的 `backend/data/`
4. 数据库会自动迁移

### Q: 支持哪些浏览器？
A: Chrome、Firefox、Edge、Safari 的最新版本都支持。

---

## 运行相关

### Q: 系统启动后访问不了？
A: 检查以下几点：
1. 确认服务器正在运行（查看终端/服务状态）
2. 检查防火墙是否开放了 3001 端口
3. 确认访问的 IP 地址和端口正确
4. 查看日志文件 `system.log`

### Q: 上传大文件失败？
A: 系统默认支持最大 500MB 的文件。如果还需要更大：
1. 编辑 `backend/src/routes/materials.js`
2. 找到 `limits: { fileSize: 500 * 1024 * 1024 }`
3. 修改为你想要的大小（单位：字节）

### Q: 如何修改默认端口？
A: 编辑 `backend/.env` 文件，修改 `PORT=3001` 为你想要的端口，然后重启系统。

### Q: 如何重置管理员密码？
A:
```bash
# 如果忘了密码，可以直接修改数据库
cd backend
node -e "
const db = require('./src/config/database');
db.init().then(async () => {
  await db.updateUser(1, { password: 'admin123' });
  console.log('Password reset to: admin123');
  process.exit();
});
"
```

---

## 数据相关

### Q: 数据存在哪里？
A: 所有数据都在 `backend/data/` 目录：
- `db/nas-materials.db` - SQLite 数据库
- `uploads/` - 上传的素材文件
- `backups/` - 自动备份
- `temp/` - 临时文件

### Q: 如何手动备份数据？
A: 直接复制整个 `backend/data/` 目录到安全位置即可。

### Q: 如何恢复备份？
A:
1. 停止系统
2. 将备份的 `data/` 目录覆盖现有的 `backend/data/`
3. 启动系统

### Q: 数据库可以换成 MySQL/PostgreSQL 吗？
A: V3 目前只支持 SQLite，但架构设计上支持多数据库。未来可能会添加 PostgreSQL 支持。

---

## 性能相关

### Q: 素材多了会卡吗？
A:
- SQLite 处理几万条数据没问题
- 如果数据非常多（10万+），建议：
  1. 定期清理不用的素材
  2. 使用 SSD 硬盘
  3. 考虑未来的 PostgreSQL 版本

### Q: 如何优化性能？
A:
1. 使用 SSD 硬盘存储数据
2. 定期清理 `data/temp/` 目录
3. 不要在同一个文件夹放太多素材（建议分页浏览）

---

## 安全相关

### Q: 如何让外网访问？
A:
1. 如果有公网 IP，直接在路由器配置端口转发
2. 使用群晖的 QuickConnect 或类似的内网穿透
3. 使用 frp、ngrok 等内网穿透工具
4. 配置 Nginx 反向代理 + SSL 证书

### Q: 建议开启 HTTPS 吗？
A: 如果在外网访问，强烈建议配置 HTTPS。可以用 Let's Encrypt 免费证书。

### Q: 系统安全吗？
A:
- 默认有登录认证
- 密码使用 bcrypt 加密
- 操作都有权限控制
- 但建议：
  1. 修改默认密码
  2. 不要把系统直接暴露在公网（除非配置了 HTTPS）
  3. 定期备份数据

---

## AI 功能相关

### Q: AI 功能需要收费吗？
A: 系统本身是免费的，但调用 AI API（如 OpenAI、Claude）需要你自己的 API Key，费用由 AI 服务商收取。

### Q: 支持哪些 AI 服务？
A: 目前支持 OpenAI 兼容的 API（OpenAI、Claude、国内的智谱、通义千问等）。

### Q: 可以不用 AI 功能吗？
A: 可以！AI 功能是可选的，不配置 API Key 也能正常使用其他功能。

---

## 还有问题？

如果本 FAQ 没解决你的问题，可以：
1. 查看日志文件 `system.log`
2. 检查详细文档 `deploy/docs/`
3. 确认使用的是最新版本
