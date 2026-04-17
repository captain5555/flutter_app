# NAS 素材管理系统 V3 - 离线部署包

## 📁 目录结构

```
deploy/
├── README.md                    # 本文档
├── windows/                     # Windows 部署
│   ├── 一键安装.bat            # Windows 一键安装
│   ├── 启动系统.bat            # Windows 启动系统
│   └── 停止系统.bat            # Windows 停止系统
├── linux/                       # Linux/NAS 部署
│   ├── install.sh               # Linux 一键安装
│   ├── start.sh                 # Linux 启动系统
│   ├── stop.sh                  # Linux 停止系统
│   └── synology/                # 群晖专用
│       └── 群晖部署指南.md
└── docs/                        # 文档
    ├── Windows部署指南.md
    ├── Linux部署指南.md
    └── 常见问题FAQ.md
```

## 🚀 快速开始

### Windows 系统
1. 双击 `windows/一键安装.bat`
2. 等待安装完成
3. 双击 `windows/启动系统.bat`
4. 浏览器访问 `http://localhost:3001`

### Linux/NAS 系统
1. 上传整个项目到服务器
2. 运行 `chmod +x linux/*.sh`
3. 运行 `linux/install.sh`
4. 运行 `linux/start.sh`
5. 浏览器访问 `http://服务器IP:3001`

### 群晖 NAS
详见 `linux/synology/群晖部署指南.md`

## 📦 离线包内容

- ✅ Node.js 安装包（Windows/Linux 版本）
- ✅ 所有 npm 依赖（已提前下载）
- ✅ 完整的 V3 系统代码
- ✅ 一键部署脚本
- ✅ 详细的部署文档

## 🆘 常见问题

详见 `docs/常见问题FAQ.md`

## 📞 技术支持

如遇问题，请查看 `docs/` 目录下的文档。
