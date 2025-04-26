// Declare the modules we created
pub mod file_item;
pub mod logging;
pub mod archive_utils;
pub mod commands;

// Re-export the commands to make them accessible for the handler
use commands::*;

/// The main entry point for the Tauri application logic.
/// Configures and runs the Tauri application.
///
/// Tauri 应用程序逻辑的主要入口点。
/// 配置并运行 Tauri 应用程序。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Initialize external plugins
        .plugin(tauri_plugin_opener::init())
        // Register the invoke handler with all exported commands
        .invoke_handler(tauri::generate_handler![
            // Window commands
            minimize_window,
            maximize_window,
            close_window,
            set_window_title,
            // Dialog commands
            select_archive_file,
            select_destination_folder,
            // Archive commands
            open_archive,
            extract_files
        ])
        // Run the application
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
