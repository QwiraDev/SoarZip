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
  try {
    return await invoke<string | null>('select_archive_file');
  } catch (error) {
    console.error('打开文件对话框失败:', error);
    throw new Error(`打开文件对话框失败: ${error}`);
  }
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
  return file.is_dir 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>`;
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