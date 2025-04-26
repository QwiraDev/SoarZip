# Soar Zip - 轻量级压缩工具

[English Version](README.md) 

---

## 项目概述

Soar Zip 是一个使用Tauri框架开发的轻量级文件压缩工具，结合了Rust后端的高性能与现代化网页前端界面，提供原生桌面应用体验。

### 功能特性
- **文件压缩**：创建、管理和查看压缩包
- **文件解压**：支持从多种格式的压缩包中提取文件和文件夹
- **文件导航**：通过直观的文件浏览器界面浏览压缩包内容
- **搜索功能**：快速在压缩包内查找文件
- **现代界面**：自定义标题栏、窗口控件和响应式设计
- **跨平台支持**：在Windows、macOS和Linux上以接近原生的性能运行
- **轻量设计**：提供完整功能的同时最小化系统资源占用

## 技术栈

- **前端**：HTML、CSS、TypeScript
- **后端**：使用Tauri框架的Rust
- **压缩库**：Rust的压缩库，提供高性能操作
- **构建系统**：使用PNPM进行包管理

## 项目结构

项目组织为以下主要目录：

```
.
├── src/ - 前端TypeScript代码
│   ├── main.ts - 应用程序入口点
│   ├── services/ - 核心业务逻辑服务
│   ├── setup/ - UI初始化模块
│   ├── styles/ - CSS样式表
│   ├── ui/ - UI组件实现
│   └── utils/ - 实用工具函数
└── src-tauri/ - Rust后端代码
    ├── src/ - Rust源文件
    │   ├── main.rs - Rust入口点
    │   └── lib.rs - 核心后端功能
    └── Cargo.toml - Rust依赖项
```

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Tauri插件](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 快速开始

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/soar-zip.git
   cd soar-zip
   ```

2. 安装依赖：
   ```bash
   pnpm install
   ```

3. 启动开发服务器：
   ```bash
   pnpm tauri dev
   ```

## 使用方法

### 打开压缩包
- 从主页或工具栏点击"打开"按钮
- 从系统中选择一个压缩包文件

### 导航压缩包内容
- 双击文件夹进入其中
- 使用导航按钮返回、前进或上升一级
- 使用路径栏直接导航到任意父文件夹

### 提取文件
1. 选择要提取的文件或文件夹
2. 点击工具栏中的"提取"按钮
3. 选择目标文件夹
4. 确认提取

### 搜索文件
- 使用右上角的搜索栏在当前文件夹中查找文件
- 结果会实时过滤显示

## 生产环境构建

要创建可分发给用户的生产构建：

```bash
pnpm tauri build
```

这将在`src-tauri/target/release`目录中生成特定平台的可执行安装程序。

## 参与贡献

欢迎贡献！请随时提交Pull Request。

1. Fork项目仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

本项目采用[GNU LGPL-3.0 许可证](LICENSE)。