use tauri::Window;
use std::process::Command;
use serde::{Serialize, Deserialize};
use std::path::Path;
use rfd::FileDialog;
use std::collections::HashSet;
use std::io::Write;
use std::fs::File;

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

#[tauri::command]
fn select_archive_file() -> Option<String> {
    // 使用rfd库打开文件选择对话框
    let file = FileDialog::new()
        .add_filter("压缩文件", &["zip", "rar", "7z", "tar", "gz"])
        .pick_file();
    
    file.and_then(|path| path.to_str().map(|s| s.to_string()))
}

fn save_debug_info(data: &str, filename: &str) {
    if let Ok(mut file) = File::create(filename) {
        if let Err(e) = file.write_all(data.as_bytes()) {
            eprintln!("写入调试文件失败: {}", e);
        }
    }
}

#[tauri::command]
fn open_archive(archive_path: &str) -> Result<Vec<FileItem>, String> {
    // 检查文件是否存在
    if !Path::new(archive_path).exists() {
        return Err(format!("压缩包不存在: {}", archive_path));
    }
    
    // 7-zip可执行文件路径
    let seven_zip_path = r"C:\Program Files\7-Zip\7z.exe";
    
    // 使用详细列表格式获取文件列表，包含完整属性
    let output = Command::new(seven_zip_path)
        .args(&["l", "-slt", archive_path])
        .output()
        .map_err(|e| format!("执行7-Zip命令失败: {}", e))?;
    
    if !output.status.success() {
        return Err(format!(
            "7-Zip命令执行失败，退出代码: {}",
            output.status.code().unwrap_or(-1)
        ));
    }
    
    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();
    let mut processed_paths = HashSet::new();
    
    // 保存debug信息
    save_debug_info(&output_str, "7z_output.txt");
    
    // 解析详细列表输出
    let mut current_item: Option<FileItem> = None;
    let mut path = String::new();
    let mut size: u64 = 0;
    let mut is_dir = false;
    let mut date = String::new();
    
    for line in output_str.lines() {
        let line = line.trim();
        
        if line.starts_with("Path = ") {
            // 新条目开始，保存之前的条目（如果存在）
            if let Some(mut item) = current_item.take() {
                item.name = item.name.replace('\\', "/"); // 再次确保路径分隔符统一
                if !processed_paths.contains(&item.name) {
                    processed_paths.insert(item.name.clone()); // 先插入再移动
                    files.push(item);
                }
            }
            
            // 获取文件路径
            path = line.trim_start_matches("Path = ").to_string();
            // 标准化路径分隔符
            path = path.replace('\\', "/");
            
            // 重置其他字段
            size = 0;
            is_dir = false;
            date = String::new();
        } else if line.starts_with("Size = ") {
            // 解析文件大小
            size = line.trim_start_matches("Size = ")
                .parse::<u64>()
                .unwrap_or(0);
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
            // 空行表示一个条目结束
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
        item.name = item.name.replace('\\', "/"); // 再次确保路径分隔符统一
        if !processed_paths.contains(&item.name) {
            processed_paths.insert(item.name.clone()); // 先插入再移动
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
    
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            minimize_window,
            maximize_window,
            close_window,
            select_archive_file,
            open_archive
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
