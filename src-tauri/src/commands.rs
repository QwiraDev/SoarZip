//! Tauri commands exposed to the frontend.
//! 暴露给前端的 Tauri 命令。

use tauri::{Window, AppHandle}; // Add AppHandle for commands needing it
use rfd::FileDialog;
use std::path::Path;

// Import struct and utils from sibling modules
use super::file_item::FileItem;
use super::logging::{log_info, log_error};
use super::archive_utils::{resolve_7z_path, run_7z_command, decode_7z_output, parse_7z_list_output};

// --- Window Commands --- 

/// Minimizes the application window.
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///
/// 最小化应用程序窗口。
///
/// # 参数
///
/// * `window` - Tauri 窗口实例。
#[tauri::command]
pub fn minimize_window(window: Window) {
    if let Err(e) = window.minimize() {
        log_error(&format!("Failed to minimize window: {}", e));
    }
}

/// Maximizes or restores the application window.
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///
/// 最大化或还原应用程序窗口。
///
/// # 参数
///
/// * `window` - Tauri 窗口实例。
#[tauri::command]
pub fn maximize_window(window: Window) {
    match window.is_maximized() {
        Ok(true) => {
            // If maximized, unmaximize (restore)
            if let Err(e) = window.unmaximize() {
                log_error(&format!("Failed to restore window: {}", e));
            }
        }
        Ok(false) => {
             // If not maximized, maximize
            if let Err(e) = window.maximize() {
                log_error(&format!("Failed to maximize window: {}", e));
            }
        }
        Err(e) => log_error(&format!("Failed to get window state: {}", e)),
    }
}

/// Closes the application window.
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///
/// 关闭应用程序窗口。
///
/// # 参数
///
/// * `window` - Tauri 窗口实例。
#[tauri::command]
pub fn close_window(window: Window) {
    if let Err(e) = window.close() {
        log_error(&format!("Failed to close window: {}", e));
    }
}

/// Sets the title of the application window.
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
/// * `title` - The desired window title.
///
/// # Returns
///
/// * `Ok(())` - If the title was set successfully.
/// * `Err(String)` - An error message if setting the title failed.
///
/// 设置应用程序窗口的标题。
///
/// # 参数
///
/// * `window` - Tauri 窗口实例。
/// * `title` - 期望的窗口标题。
///
/// # 返回值
///
/// * `Ok(())` - 如果标题设置成功。
/// * `Err(String)` - 如果设置标题失败，则返回错误消息。
#[tauri::command]
pub fn set_window_title(window: Window, title: String) -> Result<(), String> {
    match window.set_title(&title) {
        Ok(_) => {
            log_info(&format!("Window title set to: {}", title));
            Ok(())
        },
        Err(e) => {
            let error_msg = format!("Error setting window title: {}", e);
            log_error(&error_msg);
            Err(error_msg)
        }
    }
}

// --- File/Folder Dialog Commands --- 

/// Opens a file dialog for selecting an archive file.
/// Allowed extensions: zip, rar, 7z, tar, gz.
///
/// # Returns
///
/// * `Some(String)` - The selected archive file path, if a file was chosen.
/// * `None` - If the dialog was cancelled.
///
/// 打开文件对话框以选择压缩文件。
/// 允许的扩展名：zip, rar, 7z, tar, gz。
///
/// # 返回值
///
/// * `Some(String)` - 如果选择了文件，则返回所选压缩文件的路径。
/// * `None` - 如果对话框被取消。
#[tauri::command]
pub fn select_archive_file() -> Option<String> {
    log_info("Opening archive selection dialog.");
    // Use rfd library to open the file selection dialog
    let file = FileDialog::new()
        .add_filter("Archive Files", &["zip", "rar", "7z", "tar", "gz", "bz2"])
        .pick_file();

    match file {
        Some(path_buf) => {
            let path_str = path_buf.to_string_lossy().to_string();
            log_info(&format!("Archive selected: {}", path_str));
            Some(path_str)
        },
        None => {
            log_info("Archive selection cancelled.");
            None
        }
    }
}

/// Opens a folder dialog for selecting a destination directory.
///
/// # Returns
///
/// * `Some(String)` - The selected folder path, if a folder was chosen.
/// * `None` - If the dialog was cancelled.
///
/// 打开文件夹对话框以选择目标目录。
///
/// # 返回值
///
/// * `Some(String)` - 如果选择了文件夹，则返回所选文件夹的路径。
/// * `None` - 如果对话框被取消。
#[tauri::command]
pub fn select_destination_folder() -> Option<String> {
    log_info("Opening destination folder selection dialog.");
    let folder = FileDialog::new().pick_folder();
    match folder {
        Some(path_buf) => {
            let path_str = path_buf.to_string_lossy().to_string();
            log_info(&format!("Destination folder selected: {}", path_str));
            Some(path_str)
        },
        None => {
            log_info("Destination folder selection cancelled.");
            None
        }
    }
}

// --- Archive Operation Commands --- 

/// Opens an archive file and lists its contents using the bundled 7-Zip.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle (injected automatically).
/// * `archive_path` - The path to the archive file.
///
/// # Returns
///
/// * `Ok(Vec<FileItem>)` - A vector of items found in the archive.
/// * `Err(String)` - An error message if opening or parsing fails.
///
/// 使用捆绑的 7-Zip 打开压缩文件并列出其内容。
///
/// # 参数
///
/// * `app_handle` - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - 压缩文件的路径。
///
/// # 返回值
///
/// * `Ok(Vec<FileItem>)` - 在压缩包中找到的项目向量。
/// * `Err(String)` - 如果打开或解析失败，则返回错误消息。
#[tauri::command]
pub fn open_archive(app_handle: AppHandle, archive_path: String) -> Result<Vec<FileItem>, String> {
    log_info(&format!("Attempting to open archive: {}", archive_path));

    // Check if the archive file exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        log_error(&error_msg);
        return Err(error_msg);
    }

    // Resolve the path to the bundled 7-Zip executable
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    log_info(&format!("Using bundled 7-Zip at: {:?}", seven_zip_path));

    // Prepare arguments for 7-Zip list command (detailed list)
    let args = vec!["l".to_string(), "-slt".to_string(), archive_path.clone()];

    // Execute the 7-Zip command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check if the 7-Zip command executed successfully (exit code 0)
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Bundled 7-Zip list command failed with exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        log_error(&error_msg);
        return Err(error_msg);
    }

    // Decode the stdout
    let stdout_output = decode_7z_output(&output.stdout);

    // Parse the decoded output
    let files = parse_7z_list_output(&stdout_output);

    log_info(&format!("Successfully listed archive: {}", archive_path));
    Ok(files)
}


/// Extracts specified files or all files from an archive to a destination directory.
/// Uses the bundled 7-Zip executable.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle (injected automatically).
/// * `archive_path` - The path to the archive file.
/// * `files_to_extract` - A vector of relative paths within the archive to extract. If empty, extracts all.
/// * `output_directory` - The destination directory where files will be extracted.
///
/// # Returns
///
/// * `Ok(())` - If the extraction was successful.
/// * `Err(String)` - An error message if extraction fails.
///
/// 将指定文件或所有文件从压缩包解压到目标目录。
/// 使用捆绑的 7-Zip 可执行文件。
///
/// # 参数
///
/// * `app_handle` - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - 压缩文件的路径。
/// * `files_to_extract` - 要解压的压缩包内相对路径的向量。如果为空，则解压所有文件。
/// * `output_directory` - 文件将被解压到的目标目录。
///
/// # 返回值
///
/// * `Ok(())` - 如果解压成功。
/// * `Err(String)` - 如果解压失败，则返回错误消息。
#[tauri::command]
pub fn extract_files(
    app_handle: AppHandle,
    archive_path: String,
    files_to_extract: Vec<String>, // List of relative paths inside the archive
    output_directory: String,
) -> Result<(), String> {
    log_info(&format!(
        "Starting extraction to: {}, Archive: {}",
        output_directory, archive_path
    ));
    if !files_to_extract.is_empty() {
        log_info(&format!("Files/folders to extract: {:?}", files_to_extract));
    } else {
        log_info("Extracting all contents.");
    }

    // Check if archive file exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        log_error(&error_msg);
        return Err(error_msg);
    }

    // Check if output directory exists, create if not
    let output_path = Path::new(&output_directory);
    if !output_path.exists() {
        log_info(&format!("Output directory does not exist, attempting to create: {}", output_directory));
        if let Err(e) = std::fs::create_dir_all(output_path) {
            let error_msg = format!("Failed to create output directory '{}': {}", output_directory, e);
            log_error(&error_msg);
            return Err(error_msg);
        }
        log_info(&format!("Successfully created output directory: {}", output_directory));
    } else if !output_path.is_dir() {
         // Ensure the output path is actually a directory
         let error_msg = format!("Output path exists but is not a directory: {}", output_directory);
         log_error(&error_msg);
         return Err(error_msg);
    }

    // Resolve 7-Zip path
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    log_info(&format!("Using bundled 7-Zip for extraction: {:?}", seven_zip_path));

    // Build 7-Zip command arguments
    // Base command: 7z x <archive_path> -o<output_directory> [files_to_extract...] -aoa
    // 'x': Extract files with full paths
    // '-o': Specify output directory (no space after -o)
    // 'files_to_extract...': Optional list of files/dirs to extract (relative paths)
    // '-aoa': Overwrite All existing files without prompt.
    let mut args = vec![
        "x".to_string(),                // Extract command
        archive_path.clone(),       // Archive path
        format!("-o{}", output_directory), // Output directory (no space!)
        "-aoa".to_string(),             // Overwrite mode: Overwrite All files Always
    ];

    // Add specific files/folders to the arguments if provided
    // 7-Zip generally handles '/' separators well, even on Windows
    if !files_to_extract.is_empty() {
        for file in files_to_extract {
             args.push(file);
        }
    }

    // Execute the 7-Zip extraction command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check the result of the 7-Zip command
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Bundled 7-Zip extract command failed with exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        log_error(&error_msg);
        return Err(error_msg);
    }

    // Log success and potentially some output
    let stdout_output = decode_7z_output(&output.stdout);
    log_info("Bundled 7-Zip extract command executed successfully.");
    if !stdout_output.is_empty() {
         if stdout_output.len() < 500 { // Log short output fully
             log_info(&format!("7-Zip output: {}", stdout_output.trim()));
         } else { // Log length for long output
             log_info(&format!("7-Zip output length: {}", stdout_output.len()));
         }
    } else {
        log_info("7-Zip produced no output on stdout.");
    }

    Ok(())
} 