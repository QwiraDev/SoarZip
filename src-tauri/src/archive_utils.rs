//! Utilities for interacting with the bundled 7-Zip executable.
//! 与捆绑的 7-Zip 可执行文件交互的工具函数。

use std::process::{Command, Output, Stdio};
use std::path::{Path, PathBuf};
use std::collections::HashSet;
use tauri::{AppHandle, Manager}; // Add AppHandle and Manager for resource access

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use encoding_rs;

use super::file_item::FileItem; // Import FileItem from the parent module
use super::logging::{log_info, log_error}; // Import logging functions

/// Determines the relative path to the bundled 7-Zip executable based on the target OS.
/// Returns the path relative to the application's resource directory.
///
/// # Returns
///
/// * `Ok(String)` - The relative path to the 7-Zip executable.
/// * `Err(String)` - An error message if the OS is unsupported.
///
/// 根据目标操作系统确定捆绑的 7-Zip 可执行文件的相对路径。
/// 返回相对于应用程序资源目录的路径。
///
/// # 返回值
///
/// * `Ok(String)` - 7-Zip 可执行文件的相对路径。
/// * `Err(String)` - 如果操作系统不受支持，则返回错误消息。
fn get_7z_resource_path() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    { Ok("binaries/win/7z.exe".to_string()) }
    #[cfg(target_os = "macos")]
    { Ok("binaries/macos/7z".to_string()) }
    #[cfg(target_os = "linux")]
    { Ok("binaries/linux/7z".to_string()) }
    // Catch-all for unsupported OS
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    { Err("Unsupported operating system for bundled 7-Zip.".to_string()) }
}

/// Resolves the full path to the bundled 7-Zip executable.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle to access resource paths.
///
/// # Returns
///
/// * `Ok(PathBuf)` - The absolute path to the 7-Zip executable.
/// * `Err(String)` - An error message if the path cannot be resolved or the executable doesn't exist.
///
/// 解析捆绑的 7-Zip 可执行文件的完整路径。
///
/// # 参数
///
/// * `app_handle` - 用于访问资源路径的 Tauri 应用程序句柄。
///
/// # 返回值
///
/// * `Ok(PathBuf)` - 7-Zip 可执行文件的绝对路径。
/// * `Err(String)` - 如果无法解析路径或可执行文件不存在，则返回错误消息。
pub fn resolve_7z_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let resource_path_str = get_7z_resource_path()?;
    let resource_dir = app_handle.path().resource_dir()
        .map_err(|_| "Failed to get resource directory path".to_string())?; // Error getting resource dir
    let seven_zip_path_buf = resource_dir.join(resource_path_str);

    // Check if the resolved path actually exists
    if !seven_zip_path_buf.exists() {
        return Err(format!("Bundled 7-Zip executable not found at expected path: {:?}", seven_zip_path_buf));
    }
    Ok(seven_zip_path_buf)
}

/// Executes a 7-Zip command using the bundled executable.
/// Handles platform-specific execution details (like CREATE_NO_WINDOW on Windows) and output decoding.
///
/// # Arguments
///
/// * `seven_zip_path` - The path to the 7-Zip executable.
/// * `args` - A slice of string arguments for the 7-Zip command.
///
/// # Returns
///
/// * `Ok(Output)` - The process output if the command execution was initiated successfully (even if 7z returned an error).
/// * `Err(String)` - An error message if the command failed to start.
///
/// 使用捆绑的可执行文件执行 7-Zip 命令。
/// 处理特定平台的执行细节（如 Windows 上的 CREATE_NO_WINDOW）和输出解码。
///
/// # 参数
///
/// * `seven_zip_path` - 7-Zip 可执行文件的路径。
/// * `args` - 7-Zip 命令的字符串参数切片。
///
/// # 返回值
///
/// * `Ok(Output)` - 如果命令成功启动，则返回进程输出（即使 7z 返回错误）。
/// * `Err(String)` - 如果命令启动失败，则返回错误消息。
pub fn run_7z_command(seven_zip_path: &Path, args: &[String]) -> Result<Output, String> {
    log_info(&format!("Executing 7-Zip command: {:?} {:?}", seven_zip_path, args));

    #[cfg(target_os = "windows")]
    let output_result = Command::new(seven_zip_path)
        .args(args)
        .creation_flags(0x08000000) // CREATE_NO_WINDOW flag to prevent console window popup
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    #[cfg(not(target_os = "windows"))]
    let output_result = Command::new(seven_zip_path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    output_result.map_err(|e| {
        let error_msg = format!("Failed to execute bundled 7-Zip command: {}", e);
        log_error(&error_msg);
        error_msg
    })
}

/// Decodes the output (stdout or stderr) of the 7-Zip process.
/// Attempts to decode using GBK on Windows, falling back to UTF-8. Uses UTF-8 on other platforms.
/// Logs an error if decoding issues occur on Windows.
///
/// # Arguments
///
/// * `output_bytes` - The raw byte slice from the process output.
///
/// # Returns
///
/// * `String` - The decoded string, possibly with replacement characters if decoding failed.
///
/// 解码 7-Zip 进程的输出（stdout 或 stderr）。
/// 在 Windows 上尝试使用 GBK 解码，失败则回退到 UTF-8。在其他平台上使用 UTF-8。
/// 如果在 Windows 上发生解码问题，则记录错误。
///
/// # 参数
///
/// * `output_bytes` - 来自进程输出的原始字节切片。
///
/// # 返回值
///
/// * `String` - 解码后的字符串，如果解码失败，可能包含替换字符。
pub fn decode_7z_output(output_bytes: &[u8]) -> String {
    #[cfg(target_os = "windows")]
    {
        // On Windows, try GBK first as 7z console output often uses it, fallback to UTF-8
        let (decoded_cow, encoding_used, had_errors) = encoding_rs::Encoding::for_label(b"GBK")
            .unwrap_or(encoding_rs::UTF_8) // Fallback gracefully
            .decode(output_bytes);

        if had_errors {
            log_error(&format!("Error encountered while decoding 7-Zip output (used encoding: {}). Output might be garbled.", encoding_used.name()));
        }
        decoded_cow.into_owned() // Convert Cow<str> to String
    }
    #[cfg(not(target_os = "windows"))]
    {
        // On macOS and Linux, assume UTF-8
        String::from_utf8_lossy(output_bytes).into_owned() // Convert Cow<str> to String
    }
}


/// Parses the detailed listing output (`l -slt`) from 7-Zip into a vector of FileItem structs.
/// Also attempts to reconstruct the directory structure implicitly.
///
/// # Arguments
///
/// * `output_str` - The decoded string output from the 7-Zip list command.
///
/// # Returns
///
/// * `Vec<FileItem>` - A vector of file items representing the archive contents.
///
/// 将 7-Zip 的详细列表输出（`l -slt`）解析为 `FileItem` 结构体的向量。
/// 同时尝试隐式地重建目录结构。
///
/// # 参数
///
/// * `output_str` - 从 7-Zip 列表命令解码的字符串输出。
///
/// # 返回值
///
/// * `Vec<FileItem>` - 表示压缩包内容的文件项向量。
pub fn parse_7z_list_output(output_str: &str) -> Vec<FileItem> {
    let mut files = Vec::new();
    let mut processed_paths = HashSet::new(); // Track paths to avoid duplicates

    log_info("Parsing 7-Zip list output.");
    if output_str.len() < 200 { // Log preview for short outputs
        log_info(&format!("7-Zip output preview: {}...", output_str.chars().take(100).collect::<String>()));
    } else {
        log_info(&format!("7-Zip output length: {}", output_str.len()));
    }

    // State variables for parsing each item block
    let mut current_item: Option<FileItem> = None;
    let mut path_str = String::new();
    let mut size: u64 = 0;
    let mut is_dir = false;
    let mut date = String::new();

    for line in output_str.lines() {
        let line = line.trim();

        if line.starts_with("Path = ") {
            // --- Process the previously accumulated item before starting a new one ---
            if let Some(mut item) = current_item.take() {
                 // Ensure consistent path separators
                item.name = item.name.replace('\\', "/");
                // Add only if not already processed (handles potential duplicates in 7z output)
                if !processed_paths.contains(&item.name) {
                    processed_paths.insert(item.name.clone());
                    files.push(item);
                }
            }
            // --- Start accumulating data for the new item ---
            path_str = line.trim_start_matches("Path = ").to_string().replace('\\', "/");
            // Reset fields for the new item
            size = 0;
            is_dir = false;
            date = String::new();

        } else if line.starts_with("Size = ") {
            // Parse file size
            if let Ok(parsed_size) = line.trim_start_matches("Size = ").parse::<u64>() {
                size = parsed_size;
            }
        } else if line.starts_with("Folder = ") {
            // Check if it's a directory
            is_dir = line.trim_start_matches("Folder = ") == "+";
            // Ensure directory paths end with '/' for consistency
            if is_dir && !path_str.ends_with('/') {
                path_str.push('/');
            }
        } else if line.starts_with("Modified = ") {
            // Store modification date
            date = line.trim_start_matches("Modified = ").to_string();
        } else if line.is_empty() && !path_str.is_empty() {
            // An empty line signifies the end of a properties block for an item
            // Determine file type based on extension or if it's a directory
            let type_name = if is_dir {
                "文件夹".to_string() // Use "Folder" for consistency
            } else if let Some(ext) = Path::new(&path_str).extension().and_then(|os| os.to_str()) {
                 match ext.to_lowercase().as_str() {
                    "txt" => "文本文档".to_string(),
                    "jpg" | "jpeg" | "png" | "gif" | "bmp" => "图片".to_string(),
                    "pdf" => "PDF文档".to_string(),
                    "doc" | "docx" => "Word文档".to_string(),
                    "xls" | "xlsx" => "Excel表格".to_string(),
                    "ppt" | "pptx" => "PowerPoint演示文稿".to_string(),
                    "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" => "压缩文件".to_string(),
                    "exe" | "msi" => "可执行文件".to_string(),
                    "dll" => "应用扩展".to_string(),
                    "ini" | "cfg" | "conf" | "json" | "xml" | "yaml" | "toml" => "配置文件".to_string(),
                    "log" => "日志文件".to_string(),
                    "md" => "Markdown文件".to_string(),
                    "html" | "htm" => "HTML文档".to_string(),
                    "css" => "样式表".to_string(),
                    "js" | "ts" => "脚本文件".to_string(),
                    "py" => "Python脚本".to_string(),
                    "java" => "Java源文件".to_string(),
                    "c" | "cpp" | "h" => "C/C++源文件".to_string(),
                    "cs" => "C#源文件".to_string(),
                    "sh" => "Shell脚本".to_string(),
                    "bat" => "批处理脚本".to_string(),
                    "mp3" | "wav" | "ogg" | "flac" => "音频文件".to_string(),
                    "mp4" | "mkv" | "avi" | "mov" | "wmv" => "视频文件".to_string(),
                    "iso" => "镜像文件".to_string(),
                    _ => format!("{}文件", ext.to_uppercase()), // Default for unknown extensions
                }
            } else {
                "File".to_string() // Default if no extension
            };

            // Create the FileItem
            let file_item = FileItem {
                name: path_str.clone(),
                is_dir,
                size,
                modified_date: date.clone(),
                type_name,
            };

            // Store it to be potentially added in the next "Path = " line or at the end
            current_item = Some(file_item);

            // Reset path_str, as its data is now in current_item
            path_str = String::new();
        }
    }

    // --- Process the very last item after the loop finishes ---
    if let Some(mut item) = current_item.take() {
        item.name = item.name.replace('\\', "/");
        if !processed_paths.contains(&item.name) {
            processed_paths.insert(item.name.clone());
            files.push(item);
        }
    }

    // --- Reconstruct missing parent directories ---
    let mut additional_dirs = Vec::new();
    // Collect all directory paths currently known (from explicit Folder entries and added ones)
    let mut known_dir_paths: HashSet<String> = files.iter()
        .filter(|f| f.is_dir)
        .map(|f| f.name.clone())
        .chain(processed_paths.iter().filter(|p| p.ends_with('/')).cloned()) // Include paths already processed if they look like dirs
        .collect();

    // Iterate through files to find their parent directories
    for file in &files {
        if !file.is_dir { // Only process files, directories are handled above
            let path_obj = Path::new(&file.name);
            let mut current_parent = path_obj.parent();
            // Traverse up the directory tree
            while let Some(parent) = current_parent {
                // Convert parent Path to a normalized string path ending with '/'
                if let Some(parent_str_os) = parent.to_str() {
                    let parent_str = parent_str_os.replace('\\', "/");
                    if !parent_str.is_empty() {
                        let dir_path = format!("{}/", parent_str);
                        // If this directory path isn't already known, add it
                        if !known_dir_paths.contains(&dir_path) {
                            known_dir_paths.insert(dir_path.clone()); // Add to known set
                            additional_dirs.push(FileItem {
                                name: dir_path, // Store with trailing slash
                                is_dir: true,
                                size: 0, // Directories have size 0 in this context
                                modified_date: "".to_string(), // No date info available from parents
                                type_name: "Folder".to_string(),
                            });
                        }
                        current_parent = parent.parent(); // Move to the next parent
                    } else {
                        break; // Reached root or empty path component
                    }
                } else {
                     break; // Path conversion failed
                }
            }
        }
    }

    // Add the newly found directories to the main list
    files.extend(additional_dirs);

    // --- Clean up potential spurious entries from 7z output ---
    files.retain(|file| {
        let name = &file.name;
        // Filter out lines that are likely messages or headers, not actual file paths
        !name.is_empty() && // Remove empty names
        !name.contains("[MESSAGES]") &&
        !name.contains("Errors:") &&
        !name.contains("Warnings:") &&
        !name.starts_with("Scanning the drive for archives") && // Example of other potential noise
        !name.starts_with("7-Zip") && // Filter headers
        !name.starts_with("Listing archive:") &&
        !name.starts_with("----------") &&
        !name.starts_with("Path =") && // Should have been processed, but as a safeguard
        !name.starts_with("Size =") &&
        !name.starts_with("Folder =") &&
        !name.starts_with("Modified =")
    });


    // Sort the final list: directories first, then alphabetically by path
    files.sort_by(|a, b| {
        match a.is_dir.cmp(&b.is_dir).reverse() { // Directories first (true > false)
            std::cmp::Ordering::Equal => a.name.cmp(&b.name), // Then sort by name
            other => other,
        }
    });

    log_info(&format!("Successfully parsed {} file items.", files.len()));
    // Optional: Log first few items for debugging
    // for (i, file) in files.iter().enumerate().take(5) {
    //     log_info(&format!("Item {}: Name='{}', IsDir={}, Size={}, Mod='{}', Type='{}'",
    //         i, file.name, file.is_dir, file.size, file.modified_date, file.type_name));
    // }

    files
} 