/**
 * File Service Module - Handles all file and archive operations
 * 文件服务模块 - 处理所有文件和压缩包操作
 */
import { invoke } from "@tauri-apps/api/core";

/**
 * Interface representing a file or directory item within an archive
 * 表示压缩包内文件或目录项的接口
 */
export interface FileItem {
  name: string;       // Full path within the archive
  is_dir: boolean;    // Whether this item is a directory
  size: number;       // File size in bytes
  modified_date: string; // Last modified date as string
  type_name: string;  // File type description
}

/**
 * Opens a file selection dialog to choose an archive file
 * 打开文件选择对话框以选择压缩包文件
 * 
 * Uses Tauri's native dialog for selecting files
 * 使用Tauri的原生对话框选择文件
 * 
 * @returns - The selected file path, or null if cancelled
 *          - 选择的文件路径，如果取消则为null
 */
export async function selectArchiveFile(): Promise<string | null> {
  console.log("[fileService] Attempting to open file selection dialog...");
  try {
    const result = await invoke<string | null>('select_archive_file');
    console.log(`[fileService] File selection result: ${result}`);
    return result;
  } catch (error) {
    console.error('[fileService] Failed to open file dialog:', error);
    // Rethrow the error so the caller (e.g., openArchiveDialog in main.ts) can handle it
    throw new Error(`打开文件对话框失败: ${error}`); 
  }
}

/**
 * Opens a directory selection dialog to choose an extraction destination
 * 打开目录选择对话框以选择解压目标位置
 * 
 * Uses Tauri's native dialog for selecting directories
 * 使用Tauri的原生对话框选择目录
 * 
 * @returns - The selected directory path, or null if cancelled
 *          - 选择的目录路径，如果取消则为null
 */
export async function selectDestinationFolder(): Promise<string | null> {
  return await invoke<string | null>('select_destination_folder');
}

/**
 * Opens an archive file and retrieves its contents
 * 打开压缩包文件并获取其内容
 * 
 * Invokes the Rust backend to read and parse the archive
 * 调用Rust后端读取并解析压缩包
 * 
 * @param archivePath - Path to the archive file
 *                    - 压缩包文件路径
 * @returns - List of files and directories in the archive
 *          - 压缩包中的文件和目录列表
 */
export async function openArchive(archivePath: string): Promise<FileItem[]> {
  try {
    return await invoke<FileItem[]>('open_archive', { archivePath });
  } catch (error) {
    console.error('Failed to open archive:', error);
    throw new Error(`打开压缩包失败: ${error}`);
  }
}

/**
 * Extracts files from an archive to a destination directory
 * 从压缩包中解压文件到目标目录
 * 
 * Can extract specific files/folders or the entire archive
 * 可以解压特定文件/文件夹或整个压缩包
 * 
 * @param archivePath - Path to the archive file
 *                    - 压缩包文件路径
 * @param filesToExtract - Relative paths of files/folders to extract (empty for all)
 *                       - 要解压的文件/文件夹的相对路径（留空表示全部）
 * @param outputDirectory - Destination directory for extracted files
 *                        - 解压文件的目标目录
 */
export async function extractFiles(
  archivePath: string,
  filesToExtract: string[],
  outputDirectory: string
): Promise<void> {
  await invoke<void>('extract_files', {
    archivePath,
    filesToExtract,
    outputDirectory,
  });
}

/**
 * Filters files to show only those in the specified folder
 * 过滤指定文件夹下的文件
 * 
 * Used to display only the current folder contents in the UI
 * 用于在UI中仅显示当前文件夹的内容
 * 
 * @param files - List of all files in the archive
 *              - 压缩包中的所有文件列表
 * @param currentFolder - Current folder path (empty string for root)
 *                      - 当前文件夹路径（空字符串表示根目录）
 * @returns - Filtered list containing only direct children of the current folder
 *          - 仅包含当前文件夹直接子项的过滤列表
 */
export function filterFilesByFolder(files: FileItem[], currentFolder: string): FileItem[] {
  console.log(`Filtering files, current folder: "${currentFolder}", total files: ${files.length}`);
  
  if (files.length === 0) {
    console.log("Warning: No files to filter!");
    return [];
  }
  
  // Output a few sample files to help with debugging
  console.log("File examples:");
  files.slice(0, 3).forEach(file => {
    console.log(`- Name: "${file.name}", Is Directory: ${file.is_dir}`);
  });
  
  // Normalize folder path for consistent formatting
  const currentFolderNormalized = currentFolder.replace(/^\/\/|\/$/, '');
  console.log(`Normalized folder path: "${currentFolderNormalized}"`);
  
  // Filter for files and direct subfolders in the current folder
  const result = files.filter(file => {
    // Remove root path from archive for uniform path handling
    const relativePath = file.name.replace(/^\/\/|\/$/, '');
    
    let shouldInclude = false;
    
    if (currentFolderNormalized === '') {
      // Root directory: only show files/folders without path separators
      shouldInclude = !relativePath.includes('/');
    } else {
      // Subdirectory: must meet these conditions:
      // 1. Must start with the current folder path
      const startsWithCurrentFolder = relativePath.startsWith(currentFolderNormalized + '/');
      
      // 2. After removing current folder path, remaining part should have no path separators (direct child)
      let isDirectChild = false;
      if (startsWithCurrentFolder) {
        const remainingPath = relativePath.substring(currentFolderNormalized.length + 1);
        isDirectChild = !remainingPath.includes('/');
      }
      
      shouldInclude = startsWithCurrentFolder && isDirectChild;
    }
    
    // Debug a few sample items
    if (files.indexOf(file) < 3) {
      console.log(`File "${file.name}" ${shouldInclude ? 'passes' : 'fails'} filter`);
    }
    
    return shouldInclude;
  });
  
  console.log(`Filtered file count: ${result.length}`);
  return result;
}

/**
 * Sorts files by type and name
 * 按照类型和名称排序文件
 * 
 * Directories are shown first, followed by files sorted alphabetically
 * 首先显示文件夹，然后是按字母顺序排序的文件
 * 
 * @param files - List of files to sort
 *              - 要排序的文件列表
 * @returns - Sorted file list
 *          - 排序后的文件列表
 */
export function sortFiles(files: FileItem[]): FileItem[] {
  return [...files].sort((a, b) => {
    // Sort by type first: directories before files
    if (a.is_dir !== b.is_dir) {
      return a.is_dir ? -1 : 1;
    }
    // Then sort by name alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gets the display name for a file in the current folder context
 * 获取当前文件夹上下文中文件的显示名称
 * 
 * Removes the parent folder path prefix for cleaner display
 * 移除父文件夹路径前缀以便更清晰地显示
 * 
 * @param file - The file item
 *             - 文件项
 * @param currentFolder - Current folder path
 *                      - 当前文件夹路径
 * @returns - Display name for the file
 *          - 文件的显示名称
 */
export function getDisplayName(file: FileItem, currentFolder: string): string {
  let displayName = file.name;
  const currentFolderPrefix = currentFolder.replace(/^\/\/|\/$/, '');
  
  if (currentFolderPrefix && displayName.startsWith(currentFolderPrefix + '/')) {
    displayName = displayName.substring(currentFolderPrefix.length + 1);
  }
  
  // Remove trailing slash if present
  return displayName.replace(/\/$/, '');
}

/**
 * Gets the appropriate icon SVG for a file based on its type and extension
 * 根据文件类型和扩展名获取适当的图标SVG
 * 
 * Provides different icons for folders, images, documents, etc.
 * 为文件夹、图像、文档等提供不同的图标
 * 
 * @param file - The file item
 *             - 文件项
 * @returns - SVG markup for the file icon
 *          - 文件图标的SVG标记
 */
export function getFileIcon(file: FileItem): string {
  const commonIconProps = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon"';

  // Folder icon
  if (file.is_dir) {
    return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>`;
  }

  // Extract extension from filename
  const parts = file.name.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

  // Select icon based on file extension
  switch (extension) {
    // Image files
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>`;
    // Audio files
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>`;
    // Video files
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
    case 'wmv':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polygon points="22 3 16 9 12 5 8 9 2 3"></polygon> 
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              </svg>`;
    // Document files - Word
    case 'doc':
    case 'docx':
    case 'odt':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>`;
    // PDF files
    case 'pdf':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M10.4 11.9c-.3.1-.7.2-1.1.2-1.4 0-2.6-.8-2.6-2.1 0-1.2 1.1-2.1 2.5-2.1.5 0 1 .1 1.4.3"></path>
                <path d="M15.2 11.9c-.3.1-.7.2-1.1.2-1.4 0-2.6-.8-2.6-2.1 0-1.2 1.1-2.1 2.5-2.1.5 0 1 .1 1.4.3"></path>
                <path d="M12 18.4c-.7 0-1.3-.5-1.3-1.2 0-.6.4-1.2 1.3-1.2s1.3.6 1.3 1.2c0 .7-.5 1.2-1.3 1.2Z"></path>
              </svg>`;
    // Spreadsheet files
    case 'xls':
    case 'xlsx':
    case 'ods':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="10" y2="21"></line>
                <line x1="14" y1="9" x2="14" y2="21"></line>
              </svg>`;
    // Presentation files
    case 'ppt':
    case 'pptx':
    case 'odp':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>`;
    // Text files
    case 'txt':
    case 'md':
    case 'log':
    case 'ini':
    case 'cfg':
    case 'conf':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>`;
    // Archive files
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'bz2':
    case 'xz':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.1-2.4-3.8-4.6-4.4-1.8-.5-3.6-.3-5.1.5l-.5.3-4.6 3.2c-1.5.9-2.8 2.1-3.8 3.5-.9 1.3-1.3 2.8-1.1 4.3.4 2.8 2.2 5.3 4.7 6.7 1.5.8 3.1 1.2 4.7 1.2h.7c.3 0 .5-.1.7-.3l1.7-1.7c.1-.1.2-.3.2-.4 0-.2-.1-.3-.2-.4l-1.7-1.7c-.2-.2-.5-.2-.7-.1-.6.1-1.2.1-1.7-.1-2.7-.6-4.8-2.8-5.4-5.4-.4-1.9.1-3.8 1.2-5.4l4.1-2.9c.4-.3.8-.6 1.3-.8s1-.3 1.5-.3c1.3 0 2.6.5 3.6 1.4l.5.5c1.1 1 1.9 2.3 2.2 3.7.3 1.5-.1 2.9-1 4.2l-1.1 1.1c-.2.2-.2.5 0 .7l1.5 1.5c.2.2.5.2.7 0l1.1-1.1z"></path>
                <path d="M12 12 L12 6"></path> <path d="M12 12 L16 12"></path>
                <path d="M12 6 L10 8"></path> <path d="M12 6 L14 8"></path> 
              </svg>`;
    // Code files
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'scss':
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'cs':
    case 'go':
    case 'php':
    case 'rb':
    case 'swift':
    case 'kt':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>`;
    // Executable files
    case 'exe':
    case 'bat':
    case 'sh':
    case 'app': // macOS
    case 'msi':
    case 'deb':
    case 'rpm':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>`;
    // Default file icon
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>`;
  }
}

/**
 * Calculates statistics about files in the current folder
 * 计算当前文件夹中文件的统计信息
 * 
 * Used for displaying information in the status bar
 * 用于在状态栏中显示信息
 * 
 * @param files - List of all files in the archive
 *              - 压缩包中的所有文件列表
 * @param currentFolder - Current folder path
 *                      - 当前文件夹路径
 * @returns - Object containing count and total size of files in the folder
 *          - 包含文件夹中文件数量和总大小的对象
 */
export function getFileStats(files: FileItem[], currentFolder: string): { count: number, totalSize: number } {
  // Filter to get only files in the current folder
  const currentFiles = files.filter(file => {
    if (currentFolder === '') {
      // Root folder: include top-level files and directories
      return !file.name.includes('/') || 
             (file.name.split('/').filter(Boolean).length === 1 && file.name.endsWith('/'));
    } else {
      // Subfolder: include only direct children
      return file.name.startsWith(currentFolder) && 
             (file.name === currentFolder || 
              file.name.substring(currentFolder.length).split('/').filter(Boolean).length <= 1);
    }
  });
  
  // Calculate statistics
  const count = currentFiles.length;
  const totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0);
  
  return { count, totalSize };
} 