# Soar Zip - 轻量级压缩工具

[English Version](README.md) 

---

基于Tauri框架构建的轻量级文件压缩/解压工具，提供现代化的原生桌面体验。

## 项目概述

Soar Zip 是一个使用Tauri框架开发的轻量级文件压缩工具，具有以下特点：

### 功能特性
- **文件压缩**：创建和管理压缩包
- **文件解压**：支持多种压缩格式的解压
- **原生界面**：自定义标题栏和窗口控制
- **跨平台**：支持Windows、macOS和Linux

## 开发环境配置

推荐使用以下开发工具：
- [VS Code](https://code.visualstudio.com/) + [Tauri插件](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 快速开始

1. 克隆仓库
2. 安装依赖：
   ```bash
   pnpm install
   ```
3. 启动开发服务器：
   ```bash
   pnpm tauri dev
   ```

## 生产环境构建

```bash
pnpm tauri build
```

## 许可证

本项目采用[GNU LGPL-3.0 许可证](LICENSE)。