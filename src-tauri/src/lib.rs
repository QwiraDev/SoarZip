// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Window;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn minimize_window(window: Window) {
    if let Err(e) = window.minimize() {
        eprintln!("最小化窗口失败: {}", e);
    }
}

#[tauri::command]
fn maximize_window(window: Window) {
    match window.is_maximized() {
        Ok(true) => {
            if let Err(e) = window.unmaximize() {
                eprintln!("还原窗口失败: {}", e);
            }
        }
        Ok(false) => {
            if let Err(e) = window.maximize() {
                eprintln!("最大化窗口失败: {}", e);
            }
        }
        Err(e) => eprintln!("获取窗口状态失败: {}", e),
    }
}

#[tauri::command]
fn close_window(window: Window) {
    if let Err(e) = window.close() {
        eprintln!("关闭窗口失败: {}", e);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            minimize_window,
            maximize_window,
            close_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
