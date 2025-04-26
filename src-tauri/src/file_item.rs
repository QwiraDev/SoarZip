use serde::{Serialize, Deserialize};

/// Represents an item (file or directory) within an archive.
/// 表示压缩包内的一个项目（文件或目录）。
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    /// The full path of the item within the archive, using '/' as separator.
    pub name: String,
    /// Whether the item is a directory.
    pub is_dir: bool,
    /// The size of the item in bytes.
    pub size: u64,
    /// The modification date of the item as a string.
    pub modified_date: String,
    /// A descriptive name for the type of the item (e.g., "Text Document", "Folder").
    pub type_name: String,
} 