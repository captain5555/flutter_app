# V2 到 V3 数据迁移指南

## 前置条件
- V2 数据位置: `/root/nas-material-manager-v2/data/`
- V3 安装位置: `/root/nas-material-manager-v3/`

## 迁移步骤

### 1. 停止所有服务
```bash
# 杀掉所有 node 进程
pkill -f "node"

# 确认已停止
ps aux | grep node
```

### 2. 备份 V3 空数据
```bash
cd ~/nas-material-manager-v3/backend
mv data data.empty-backup
```

### 3. 复制 V2 数据
```bash
cp -r /root/nas-material-manager-v2/data ~/nas-material-manager-v3/backend/
```

### 4. 验证复制
```bash
ls -la ~/nas-material-manager-v3/backend/data/
```

### 5. 启动 V3
```bash
cd ~/nas-material-manager-v3/backend
nohup node src/server.js > system.log 2>&1 &
disown
```

### 6. 查看日志
```bash
tail -f system.log
```

## V3 会自动处理
- 启动时会自动添加 `used_at` 列（如果不存在）
- 自动创建 `ai_settings` 表（如果不存在）
- 保持所有现有数据不变
