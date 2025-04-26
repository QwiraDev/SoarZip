# Soar Zip

[中文](README_CN.md)

---

## Project Overview

Soar Zip is a lightweight file compression and extraction tool built with Tauri, providing a native desktop experience with modern UI. It combines the performance of Rust's backend capabilities with a responsive web UI frontend.

### Features
- **File Compression**: Create, manage, and view compressed archives.
- **File Extraction**: Extract files and folders from supported archive formats.
- **File Navigation**: Browse archive contents with intuitive file explorer interface.
- **Search Functionality**: Quickly find files within archives.
- **Modern UI**: Custom title bar, window controls, and responsive design.
- **Cross-platform**: Runs natively on Windows, macOS, and Linux with near-native performance.
- **Lightweight**: Minimal system resources usage while providing full functionality.

## Technology Stack

- **Frontend**: HTML, CSS, TypeScript
- **Backend**: Rust with Tauri framework
- **Compression Libraries**: Rust's compression libraries for high-performance operations
- **Build System**: PNPM for package management

## Project Structure

The project is organized into the following key directories:

```
.
├── src/ - Frontend TypeScript code
│   ├── main.ts - Application entry point
│   ├── services/ - Core business logic services
│   ├── setup/ - UI initialization modules
│   ├── styles/ - CSS stylesheets
│   ├── ui/ - UI component implementations
│   └── utils/ - Utility functions
└── src-tauri/ - Rust backend code
    ├── src/ - Rust source files
    │   ├── main.rs - Rust entry point
    │   └── lib.rs - Core backend functionality
    └── Cargo.toml - Rust dependencies
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/soar-zip.git
   cd soar-zip
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm tauri dev
   ```

## Usage

### Opening Archives
- Click "Open" from the home screen or toolbar
- Select an archive file from your system

### Navigating Archive Contents
- Double-click on folders to navigate into them
- Use the navigation buttons to go back, forward, or up a level
- Use the path bar to directly navigate to any parent folder

### Extracting Files
1. Select files or folders you want to extract
2. Click the "Extract" button in the toolbar
3. Choose a destination folder
4. Confirm extraction

### Searching Files
- Use the search bar in the top-right to find files in the current folder
- Results will be filtered in real-time

## Build for Production

To create a production build that can be distributed to users:

```bash
pnpm tauri build
```

This will generate platform-specific executable installers in the `src-tauri/target/release` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [GNU LGPL-3.0 License](LICENSE).
