/**
 * 文件服务模块 - 处理文件相关操作
 */
import { invoke } from "@tauri-apps/api/core";

// 定义文件项类型
export interface FileItem {
  name: string;
  is_dir: boolean;
  size: number;
  modified_date: string;
  type_name: string;
}

/**
 * 打开文件选择对话框
 * @returns 选择的文件路径，如果取消则为 null
 */
export async function selectArchiveFile(): Promise<string | null> {
  console.log("[fileService] Attempting to open file selection dialog...");
  try {
    const result = await invoke<string | null>('select_archive_file');
    console.log(`[fileService] File selection result: ${result}`);
    return result;
  } catch (error) {
    console.error('[fileService] 打开文件对话框失败:', error);
    // Rethrow the error so the caller (e.g., openArchiveDialog in main.ts) can handle it
    throw new Error(`打开文件对话框失败: ${error}`); 
  }
}

/**
 * 打开目录选择对话框
 * @returns 选择的目录路径，如果取消则为 null
 */
export async function selectDestinationFolder(): Promise<string | null> {
  return await invoke<string | null>('select_destination_folder');
}

/**
 * 打开压缩包并获取其内容
 * @param archivePath 压缩包路径
 * @returns 压缩包内容列表
 */
export async function openArchive(archivePath: string): Promise<FileItem[]> {
  try {
    return await invoke<FileItem[]>('open_archive', { archivePath });
  } catch (error) {
    console.error('打开压缩包失败:', error);
    throw new Error(`打开压缩包失败: ${error}`);
  }
}

/**
 * 解压文件
 * @param archivePath 压缩包路径
 * @param filesToExtract 文件/文件夹相对于压缩包根目录的路径
 * @param outputDirectory 解压目标目录
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
 * 过滤指定文件夹下的文件
 * @param files 所有文件列表
 * @param currentFolder 当前文件夹路径
 * @returns 过滤后的文件列表
 */
export function filterFilesByFolder(files: FileItem[], currentFolder: string): FileItem[] {
  console.log(`过滤文件，当前文件夹: "${currentFolder}", 总文件数: ${files.length}`);
  
  if (files.length === 0) {
    console.log("警告: 没有文件可过滤!");
    return [];
  }
  
  // 输出几个示例文件帮助调试
  console.log("文件示例:");
  files.slice(0, 3).forEach(file => {
    console.log(`- 名称: "${file.name}", 是文件夹: ${file.is_dir}`);
  });
  
  // 标准化文件夹路径 - 确保格式一致性
  const currentFolderNormalized = currentFolder.replace(/^\/\/|\/$/, '');
  console.log(`标准化后的文件夹路径: "${currentFolderNormalized}"`);
  
  // 筛选当前文件夹下的文件和直接子文件夹
  const result = files.filter(file => {
    // 移除压缩包根路径，统一处理路径
    const relativePath = file.name.replace(/^\/\/|\/$/, '');
    
    let shouldInclude = false;
    
    if (currentFolderNormalized === '') {
      // 根目录：只显示没有路径分隔符或者只有一层路径的文件/文件夹
      shouldInclude = !relativePath.includes('/');
    } else {
      // 子文件夹：必须满足以下条件
      // 1. 必须以当前文件夹路径开头
      const startsWithCurrentFolder = relativePath.startsWith(currentFolderNormalized + '/');
      
      // 2. 移除当前文件夹路径后，剩余部分不能再包含路径分隔符(直接子项)
      let isDirectChild = false;
      if (startsWithCurrentFolder) {
        const remainingPath = relativePath.substring(currentFolderNormalized.length + 1);
        isDirectChild = !remainingPath.includes('/');
      }
      
      shouldInclude = startsWithCurrentFolder && isDirectChild;
    }
    
    // 调试几个示例项
    if (files.indexOf(file) < 3) {
      console.log(`文件 "${file.name}" ${shouldInclude ? '通过' : '不通过'} 过滤`);
    }
    
    return shouldInclude;
  });
  
  console.log(`过滤后文件数: ${result.length}`);
  return result;
}

/**
 * 按照类型和名称排序文件
 * @param files 文件列表
 * @returns 排序后的文件列表
 */
export function sortFiles(files: FileItem[]): FileItem[] {
  return [...files].sort((a, b) => {
    // 先按类型排序：文件夹在前
    if (a.is_dir !== b.is_dir) {
      return a.is_dir ? -1 : 1;
    }
    // 再按名称排序
    return a.name.localeCompare(b.name);
  });
}

/**
 * 获取文件显示名称
 * @param file 文件项
 * @param currentFolder 当前文件夹路径
 * @returns 显示用的文件名
 */
export function getDisplayName(file: FileItem, currentFolder: string): string {
  let displayName = file.name;
  const currentFolderPrefix = currentFolder.replace(/^\/\/|\/$/, '');
  
  if (currentFolderPrefix && displayName.startsWith(currentFolderPrefix + '/')) {
    displayName = displayName.substring(currentFolderPrefix.length + 1);
  }
  
  // 移除末尾的斜杠
  return displayName.replace(/\/$/, '');
}

/**
 * 获取文件图标
 * @param file 文件项
 * @returns 文件图标的SVG代码
 */
export function getFileIcon(file: FileItem): string {
  const commonIconProps = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon"';

  // 文件夹图标
  if (file.is_dir) {
    return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>`;
  }

  // 从文件名提取扩展名
  const parts = file.name.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

  // 根据扩展名选择图标
  switch (extension) {
    // 图片
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
    // 音频
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>`;
    // 视频
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
    // 文档
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
    case 'pdf':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M10.4 11.9c-.3.1-.7.2-1.1.2-1.4 0-2.6-.8-2.6-2.1 0-1.2 1.1-2.1 2.5-2.1.5 0 1 .1 1.4.3"></path>
                <path d="M15.2 11.9c-.3.1-.7.2-1.1.2-1.4 0-2.6-.8-2.6-2.1 0-1.2 1.1-2.1 2.5-2.1.5 0 1 .1 1.4.3"></path>
                <path d="M12 18.4c-.7 0-1.3-.5-1.3-1.2 0-.6.4-1.2 1.3-1.2s1.3.6 1.3 1.2c0 .7-.5 1.2-1.3 1.2Z"></path>
              </svg>`;
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
    case 'ppt':
    case 'pptx':
    case 'odp':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>`;
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
              </svg>`; // Same as doc for now
    // 压缩包
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
    // 代码文件
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
    // 可执行文件/脚本
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
              </svg>`; // Gear/Settings icon
    // 默认文件图标
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>`;
  }
}

/**
 * 统计当前文件夹中的文件信息
 * @param files 所有文件列表
 * @param currentFolder 当前文件夹路径
 * @returns {Object} 文件统计信息，包括数量和总大小
 */
export function getFileStats(files: FileItem[], currentFolder: string): { count: number, totalSize: number } {
  const currentFiles = files.filter(file => {
    if (currentFolder === '') {
      return !file.name.includes('/') || 
             (file.name.split('/').filter(Boolean).length === 1 && file.name.endsWith('/'));
    } else {
      return file.name.startsWith(currentFolder) && 
             (file.name === currentFolder || 
              file.name.substring(currentFolder.length).split('/').filter(Boolean).length <= 1);
    }
  });
  
  const count = currentFiles.length;
  const totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0);
  
  return { count, totalSize };
} 