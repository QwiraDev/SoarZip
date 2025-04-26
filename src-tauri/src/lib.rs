use tauri::{Window, Manager};
use std::process::Command;
use serde::{Serialize, Deserialize};
use std::path::Path;
use rfd::FileDialog;
use std::collections::HashSet;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use encoding_rs; // <-- 在 Windows 条件编译下导入

// 文件项结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    name: String,
    is_dir: bool,
    size: u64,
    modified_date: String,
    type_name: String,
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

#[tauri::command]
fn select_archive_file() -> Option<String> {
    // 使用rfd库打开文件选择对话框
    let file = FileDialog::new()
        .add_filter("压缩文件", &["zip", "rar", "7z", "tar", "gz"])
        .pick_file();
    
    file.and_then(|path| path.to_str().map(|s| s.to_string()))
}

// 新增：选择目标文件夹命令
#[tauri::command]
fn select_destination_folder() -> Option<String> {
    let folder = FileDialog::new().pick_folder();
    folder.and_then(|path| path.to_str().map(|s| s.to_string()))
}

// 新增：简单的日志打印函数
fn log_info(message: &str) {
    println!("[SoarZip INFO] {}", message);
}

fn log_error(message: &str) {
    eprintln!("[SoarZip ERROR] {}", message);
}

// Helper function to determine the resource path for 7z based on platform
fn get_7z_resource_path() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    { Ok("binaries/win/7z.exe".to_string()) }
    #[cfg(target_os = "macos")]
    { Ok("binaries/macos/7z".to_string()) }
    #[cfg(target_os = "linux")]
    { Ok("binaries/linux/7z".to_string()) }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    { Err("Unsupported operating system for bundled 7-Zip.".to_string()) }
}

#[tauri::command]
fn open_archive(window: Window, archive_path: &str) -> Result<Vec<FileItem>, String> {
    log_info(&format!("开始打开压缩包: {}", archive_path));
    
    // Check if archive file exists
    if !Path::new(archive_path).exists() {
        let error_msg = format!("压缩包不存在: {}", archive_path);
        log_error(&error_msg);
        return Err(error_msg);
    }
    
    // Get the path to the bundled 7-Zip executable
    let resource_path_str = get_7z_resource_path()?;
    
    // 使用正确的 Tauri API 获取资源目录
    let app_handle = window.app_handle();
    let resource_dir = app_handle.path().resource_dir()
        .map_err(|_| "无法获取资源目录路径".to_string())?;
    // 构建 7-Zip 完整路径
    let seven_zip_path_buf = resource_dir.join(resource_path_str);
    
    // Check if the resolved path actually exists
    if !seven_zip_path_buf.exists() {
        return Err(format!("捆绑的 7-Zip 可执行文件不存在于预期路径: {:?}", seven_zip_path_buf));
    }
    
    let seven_zip_path = seven_zip_path_buf.to_string_lossy().to_string();
    log_info(&format!("使用捆绑的 7-Zip 路径: {}", seven_zip_path));
    
    // Execute 7-Zip command using the bundled executable
    #[cfg(target_os = "windows")]
    let output = Command::new(&seven_zip_path)
        .args(&["l", "-slt", archive_path])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .stdout(std::process::Stdio::piped()) 
        .stderr(std::process::Stdio::piped()) 
        .output()
        .map_err(|e| {
            let error_msg = format!("执行捆绑的 7-Zip 命令失败: {}", e);
            log_error(&error_msg);
            error_msg
        })?;
        
    #[cfg(not(target_os = "windows"))]
    let output = Command::new(&seven_zip_path)
        .args(&["l", "-slt", archive_path])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output()
        .map_err(|e| {
            let error_msg = format!("执行捆绑的 7-Zip 命令失败: {}", e);
            log_error(&error_msg);
            error_msg
        })?;
    
    if !output.status.success() {
        // 尝试根据平台解码 stderr
        #[cfg(target_os = "windows")]
        let (error_cow, _encoding_used, _had_errors) = encoding_rs::Encoding::for_label(b"GBK")
            .unwrap_or(encoding_rs::UTF_8) // 如果GBK标签失败，则回退到UTF-8
            .decode(&output.stderr);
        #[cfg(target_os = "windows")]
        let error_message = error_cow.as_ref();

        #[cfg(not(target_os = "windows"))]
        let error_message_cow = String::from_utf8_lossy(&output.stderr); // 其他平台假定UTF-8
        #[cfg(not(target_os = "windows"))]
        let error_message = error_message_cow.as_ref();
        
        let error_msg = format!(
            "捆绑的 7-Zip 命令执行失败，退出代码: {}，错误信息: {}",
            output.status.code().unwrap_or(-1),
            error_message
        );
        log_error(&error_msg);
        return Err(error_msg);
    }
    
    // 根据平台解码 stdout
    #[cfg(target_os = "windows")]
    let (output_cow, encoding_used, had_errors) = encoding_rs::Encoding::for_label(b"GBK") // Windows 尝试 GBK
        .unwrap_or(encoding_rs::UTF_8) // 优雅地回退
        .decode(&output.stdout);
    #[cfg(target_os = "windows")]
    let output_str = output_cow.as_ref();
    #[cfg(target_os = "windows")]
    if had_errors {
        log_error(&format!("解码7-Zip输出时遇到错误 (使用编码: {}). 可能存在乱码.", encoding_used.name()));
    }

    #[cfg(not(target_os = "windows"))]
    let output_str_cow = String::from_utf8_lossy(&output.stdout); // macOS/Linux 假定 UTF-8
    #[cfg(not(target_os = "windows"))]
    let output_str = output_str_cow.as_ref();

    let mut files = Vec::new();
    let mut processed_paths = HashSet::new();
    
    log_info("捆绑的 7-Zip 命令成功执行并获取到输出。");
    if output_str.len() < 200 { // 只打印较短的输出
        log_info(&format!("7-Zip输出预览: {}...", output_str.chars().take(100).collect::<String>()));
    } else {
        log_info(&format!("7-Zip输出长度: {}", output_str.len()));
    }
    
    // 解析详细列表输出
    let mut current_item: Option<FileItem> = None;
    let mut path = String::new();
    let mut size: u64 = 0;
    let mut is_dir = false;
    let mut date = String::new();
    
    for line in output_str.lines() {
        let line = line.trim();
        
        if line.starts_with("Path = ") {
            // 保存前一个条目
            if let Some(mut item) = current_item.take() {
                item.name = item.name.replace('\\', "/"); // 统一路径分隔符
                if !processed_paths.contains(&item.name) {
                    processed_paths.insert(item.name.clone());
                    files.push(item);
                }
            }
            
            // 获取并标准化文件路径
            path = line.trim_start_matches("Path = ").to_string().replace('\\', "/");
            
            // 重置字段
            size = 0;
            is_dir = false;
            date = String::new();
        } else if line.starts_with("Size = ") {
            // 解析文件大小
            if let Ok(parsed_size) = line.trim_start_matches("Size = ").parse::<u64>() {
                size = parsed_size;
            }
        } else if line.starts_with("Folder = ") {
            // 解析是否为文件夹
            is_dir = line.trim_start_matches("Folder = ") == "+";
            // 确保文件夹路径以/结尾
            if is_dir && !path.ends_with('/') {
                path.push('/');
            }
        } else if line.starts_with("Modified = ") {
            // 解析修改日期
            date = line.trim_start_matches("Modified = ").to_string();
        } else if line.is_empty() && !path.is_empty() {
            // 空行表示条目结束，处理当前条目
            // 确定文件类型
            let type_name = if is_dir {
                "文件夹".to_string()
            } else if let Some(ext) = Path::new(&path).extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                match ext_str.as_str() {
                    "txt" => "文本文档".to_string(),
                    "jpg" | "jpeg" | "png" | "gif" => "图像".to_string(),
                    "pdf" => "PDF文档".to_string(),
                    "doc" | "docx" => "Word文档".to_string(),
                    "xls" | "xlsx" => "Excel表格".to_string(),
                    "ppt" | "pptx" => "PowerPoint演示文稿".to_string(),
                    "zip" | "rar" | "7z" => "压缩文件".to_string(),
                    "exe" => "可执行程序".to_string(),
                    "dll" => "应用程序扩展".to_string(),
                    "hlf" => "帮助文件".to_string(),
                    "lng" => "语言文件".to_string(),
                    "ini" => "配置文件".to_string(),
                    "reg" => "注册表文件".to_string(),
                    _ => format!("{} 文件", ext_str),
                }
            } else {
                "文件".to_string()
            };
            
            // 创建文件项
            let file_item = FileItem {
                name: path.clone(),
                is_dir,
                size,
                modified_date: date.clone(),
                type_name,
            };
            
            current_item = Some(file_item);
            
            // 重置变量，准备下一个条目
            path = String::new();
            size = 0;
            is_dir = false;
            date = String::new();
        }
    }
    
    // 添加最后一个条目（如果有）
    if let Some(mut item) = current_item.take() {
        item.name = item.name.replace('\\', "/"); // 确保路径分隔符统一
        if !processed_paths.contains(&item.name) {
            processed_paths.insert(item.name.clone());
            files.push(item);
        }
    }
    
    // 创建目录结构
    let mut additional_dirs = Vec::new();
    let mut dir_paths: HashSet<String> = files.iter().filter(|f| f.is_dir).map(|f| f.name.clone()).collect();
    
    // 收集文件父目录路径
    for file in &files {
        if !file.is_dir {
            let path_obj = Path::new(&file.name);
            let mut current = path_obj.parent();
            while let Some(parent) = current {
                let parent_str = parent.to_string_lossy().replace('\\', "/");
                if !parent_str.is_empty() {
                    let dir_path = format!("{}/", parent_str);
                    if !dir_paths.contains(&dir_path) {
                        dir_paths.insert(dir_path.clone());
                        additional_dirs.push(FileItem {
                            name: dir_path,
                            is_dir: true,
                            size: 0,
                            modified_date: "".to_string(),
                            type_name: "文件夹".to_string(),
                        });
                    }
                    current = parent.parent();
                } else {
                    break;
                }
            }
        }
    }
    
    // 添加缺失的目录
    files.extend(additional_dirs);
    
    // 清理特殊项
    files.retain(|file| {
        let name = &file.name;
        !name.contains("[MESSAGES]") &&
        !name.contains("Errors:") &&
        !name.contains("Warnings:") &&
        !name.starts_with("[Warning]") &&
        !name.starts_with("[Error]") &&
        !name.is_empty() // 移除空名称项
    });
    
    // 按照路径排序，目录在前，文件在后
    files.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            return b.is_dir.cmp(&a.is_dir); // 目录在前
        }
        a.name.cmp(&b.name)
    });
    
    log_info(&format!("共解析出{}个文件项", files.len()));
    // 可以选择性地打印一些解析出的文件信息用于调试
    // for (i, file) in files.iter().enumerate().take(5) {
    //     log_info(&format!("文件{}: {} (是否文件夹: {})", i, file.name, file.is_dir));
    // }
    
    Ok(files)
}

// 新增：解压文件命令
#[tauri::command]
fn extract_files(
    window: Window,
    archive_path: String,
    files_to_extract: Vec<String>, // 要解压的文件/文件夹路径列表 (相对于压缩包根目录)
    output_directory: String,
) -> Result<(), String> {
    log_info(&format!(
        "开始解压文件到: {}, 压缩包: {}",
        output_directory, archive_path
    ));
    log_info(&format!("要解压的文件/文件夹: {:?}", files_to_extract));

    // 检查压缩包是否存在
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("压缩包不存在: {}", archive_path);
        log_error(&error_msg);
        return Err(error_msg);
    }

    // 检查输出目录是否存在，如果不存在则尝试创建
    let output_path = Path::new(&output_directory);
    if !output_path.exists() {
        log_info(&format!("输出目录不存在，尝试创建: {}", output_directory));
        if let Err(e) = std::fs::create_dir_all(output_path) {
            let error_msg = format!("创建输出目录失败: {}, 错误: {}", output_directory, e);
            log_error(&error_msg);
            return Err(error_msg);
        }
        log_info(&format!("成功创建输出目录: {}", output_directory));
    } else if !output_path.is_dir() {
         let error_msg = format!("输出路径不是一个有效的目录: {}", output_directory);
         log_error(&error_msg);
         return Err(error_msg);
    }

    // 获取 7-Zip 路径
    let resource_path_str = get_7z_resource_path()?;
    let app_handle = window.app_handle();
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|_| "无法获取资源目录路径".to_string())?;
    let seven_zip_path_buf = resource_dir.join(resource_path_str);

    if !seven_zip_path_buf.exists() {
        return Err(format!(
            "捆绑的 7-Zip 可执行文件不存在于预期路径: {:?}",
            seven_zip_path_buf
        ));
    }
    let seven_zip_path = seven_zip_path_buf.to_string_lossy().to_string();
    log_info(&format!("使用捆绑的 7-Zip 进行解压: {}", seven_zip_path));

    // 构建 7-Zip 命令参数
    // 基础命令: 7z x <archive_path> -o<output_directory> [files_to_extract...] -aoa
    // 'x': 解压文件，保持目录结构
    // '-o': 指定输出目录，注意 -o 和目录之间没有空格
    // 'files_to_extract...': 可选参数，指定要解压的文件或目录
    // '-aoa': Overwrite All existing files without prompt. (覆盖所有文件)
    let mut args = vec![
        "x".to_string(),
        archive_path.clone(),
        format!("-o{}", output_directory), // 注意这里没有空格
        "-aoa".to_string(), // 覆盖模式
    ];

    // 如果提供了具体的文件/文件夹列表，则添加到参数中
    // 注意：7zip 需要的是相对于压缩包内部的路径
    if !files_to_extract.is_empty() {
        for file in files_to_extract {
            // 确保路径使用系统分隔符？(7zip通常能处理/) 但windows可能需要转换
            // let os_specific_path = file.replace("/", &std::path::MAIN_SEPARATOR.to_string());
            // args.push(os_specific_path);
             args.push(file); // 尝试直接使用传入的路径，7zip对 '/' 的兼容性较好
        }
    }

    log_info(&format!("执行 7-Zip 命令: {} {:?}", seven_zip_path, args));

    // 执行 7-Zip 命令
    #[cfg(target_os = "windows")]
    let output_result = Command::new(&seven_zip_path)
        .args(&args)
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output();

    #[cfg(not(target_os = "windows"))]
    let output_result = Command::new(&seven_zip_path)
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output();

    let output = output_result.map_err(|e| {
        let error_msg = format!("执行捆绑的 7-Zip 解压命令失败: {}", e);
        log_error(&error_msg);
        error_msg
    })?;

    // 检查命令执行结果
    if !output.status.success() {
        #[cfg(target_os = "windows")]
        let (error_cow, _, _) = encoding_rs::Encoding::for_label(b"GBK")
            .unwrap_or(encoding_rs::UTF_8)
            .decode(&output.stderr);
        #[cfg(target_os = "windows")]
        let error_message = error_cow.as_ref();

        #[cfg(not(target_os = "windows"))]
        let error_message_cow = String::from_utf8_lossy(&output.stderr);
        #[cfg(not(target_os = "windows"))]
        let error_message = error_message_cow.as_ref();

        let error_msg = format!(
            "捆绑的 7-Zip 解压命令执行失败，退出代码: {}，错误信息: {}",
            output.status.code().unwrap_or(-1),
            error_message.trim()
        );
        log_error(&error_msg);
        return Err(error_msg);
    }

    // 打印部分成功输出信息 (stdout)
    #[cfg(target_os = "windows")]
    let (output_cow, _, _) = encoding_rs::Encoding::for_label(b"GBK")
        .unwrap_or(encoding_rs::UTF_8)
        .decode(&output.stdout);
    #[cfg(target_os = "windows")]
    let success_output = output_cow.as_ref();

    #[cfg(not(target_os = "windows"))]
    let success_output_cow = String::from_utf8_lossy(&output.stdout);
    #[cfg(not(target_os = "windows"))]
    let success_output = success_output_cow.as_ref();


    log_info("捆绑的 7-Zip 解压命令成功执行。");
    if success_output.len() < 500 { // 只打印较短的输出
         log_info(&format!("7-Zip输出预览: {}", success_output.trim()));
    } else {
         log_info(&format!("7-Zip输出长度: {}", success_output.len()));
    }


    Ok(())
}

#[tauri::command]
fn set_window_title(window: tauri::Window, title: String) -> Result<(), String> {
    match window.set_title(&title) {
        Ok(_) => {
            println!("[SoarZip INFO] Window title set to: {}", title);
            Ok(())
        },
        Err(e) => {
            eprintln!("[SoarZip ERROR] Error setting window title: {}", e);
            Err(format!("Failed to set window title: {}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            maximize_window,
            close_window,
            select_archive_file,
            open_archive,
            select_destination_folder,
            extract_files,
            set_window_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
