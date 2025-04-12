# Soar Zip

[中文](readme_CN.md)

---

## Project Overview

Soar Zip is a lightweight file compression and extraction tool built with Tauri, providing a native desktop experience with modern UI.

### Features
- **File Compression**: Create and manage compressed archives.
- **File Extraction**: Extract files from supported archive formats.
- **Native UI**: Custom title bar and window controls.
- **Cross-platform**: Runs on Windows, macOS, and Linux.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm tauri dev
   ```

## Build for Production

```bash
pnpm tauri build
```

## License

This project is licensed under the [GNU LGPL-3.0 License](LICENSE).

