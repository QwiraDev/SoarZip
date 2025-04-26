// Declare the modules we created
pub mod file_item;
pub mod logging;
pub mod archive_utils;
pub mod commands;

use std::sync::Mutex;
use tauri_plugin_cli::CliExt;
use tauri::Manager;

// Re-export the commands to make them accessible for the handler
use commands::*;

// State to hold the initial file path passed via CLI arguments
struct CliFilePathState {
    path: Mutex<Option<String>>,
}

impl CliFilePathState {
    fn set_path(&self, path: String) {
        *self.path.lock().unwrap() = Some(path);
    }

    fn take_path(&self) -> Option<String> {
        self.path.lock().unwrap().take()
    }
}

/// Retrieves the initial file path passed via CLI arguments, if any.
/// This command should be called once by the frontend on startup.
///
/// 获取通过 CLI 参数传递的初始文件路径（如果有）。
/// 前端应在启动时调用此命令一次。
#[tauri::command]
fn get_initial_file_path(state: tauri::State<CliFilePathState>) -> Option<String> {
    state.take_path()
}

/// The main entry point for the Tauri application logic.
/// Configures and runs the Tauri application.
///
/// Tauri 应用程序逻辑的主要入口点。
/// 配置并运行 Tauri 应用程序。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Manage the state for the initial file path
        .manage(CliFilePathState { path: Mutex::new(None) })
        // Initialize external plugins
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_cli::init())
        // Setup hook to handle CLI arguments
        .setup(|app| {
            let state = app.state::<CliFilePathState>();
            match app.cli().matches() {
                Ok(matches) => {
                    if let Some(arg_data) = matches.args.get("filePath") {
                        // arg_data.value is assumed to be serde_json::Value directly
                        if let Some(path_str) = arg_data.value.as_str() {
                            state.set_path(path_str.to_string());
                            println!("Received file path from CLI: {}", path_str);
                        } else {
                            // Handle the case where the argument value is not a string
                            eprintln!("Warning: filePath argument received, but its value is not a string: {:?}", arg_data.value);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to parse CLI arguments: {}", e);
                }
            }
            Ok(())
        })
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
            extract_files,
            // New command
            get_initial_file_path
        ])
        // Run the application
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
