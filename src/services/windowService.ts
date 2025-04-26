/**
 * 窗口服务模块 - 处理窗口相关操作
 */
import { invoke } from "@tauri-apps/api/core";

/**
 * 最小化窗口
 */
export async function minimizeWindow(): Promise<void> {
  console.log("[windowService] Attempting to minimize window...");
  try {
    await invoke('minimize_window');
    console.log("[windowService] Minimize window invoked successfully.");
  } catch (error) {
    console.error('[windowService] 最小化窗口失败:', error);
  }
}

/**
 * 最大化或还原窗口
 */
export async function maximizeWindow(): Promise<void> {
  console.log("[windowService] Attempting to maximize/restore window...");
  try {
    await invoke('maximize_window');
    console.log("[windowService] Maximize/restore window invoked successfully.");
  } catch (error) {
    console.error('[windowService] 最大化/还原窗口失败:', error);
  }
}

/**
 * 关闭窗口
 */
export async function closeWindow(): Promise<void> {
  console.log("[windowService] Attempting to close window...");
  try {
    await invoke('close_window');
    // No log after successful close as the app might terminate
  } catch (error) {
    console.error('[windowService] 关闭窗口失败:', error);
  }
}

/**
 * 设置窗口标题
 * @param title 标题文本
 */
export async function setWindowTitle(title: string): Promise<void> {
  // 1. Update the custom title bar element
  const currentFileElement = document.getElementById('current-file');
  if (currentFileElement) {
    currentFileElement.textContent = title || '未打开文件'; // Use provided title or default
    console.log(`[windowService] Custom title bar element updated to: "${title}"`);
  } else {
    console.warn('[windowService] Custom title bar element #current-file not found.');
  }

  // 2. Update the actual OS window title via backend
  console.log(`[windowService] Invoking set_window_title with title: "${title}"`);
  try {
    await invoke('set_window_title', { title });
    console.log(`[windowService] Successfully invoked set_window_title for: "${title}"`);
  } catch (error) {
    console.error(`[windowService] Failed to invoke set_window_title for "${title}":`, error);
  }
}

/**
 * 从文件路径中提取文件名
 * @param filePath 文件路径
 * @returns 文件名
 */
export function getFileNameFromPath(filePath: string): string {
  if (!filePath) return '';
  // 替换所有反斜杠为正斜杠，然后按正斜杠分割
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

/**
 * 提取目录路径
 * @param filePath 文件路径
 * @returns 目录路径
 */
export function getDirectoryPath(filePath: string): string {
  if (!filePath) return '';
  const normalizedPath = filePath.replace(/\\/g, '/');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return ''; // Or perhaps '.' if it's just a filename?
  }
  return normalizedPath.substring(0, lastSlashIndex);
}

/**
 * 提取文件名（不带扩展名）
 * @param filePath 文件路径
 * @returns 文件名（不带扩展名）
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const fileName = getFileNameFromPath(filePath);
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return fileName; // No extension or hidden file like .myfile
  }
  return fileName.substring(0, lastDotIndex);
}

/**
 * 生成默认解压路径 (同目录下同名文件夹)
 * @param archivePath 压缩包路径
 * @returns 默认解压路径
 */
export function getDefaultExtractPath(archivePath: string): string {
  const dirPath = getDirectoryPath(archivePath);
  const baseName = getFileNameWithoutExtension(archivePath);
  // 在 Windows 和 macOS/Linux 上，路径分隔符可能不同
  // 这里我们统一使用 /，Tauri 和 Rust 通常能更好地处理它
  // 如果需要特定于操作系统的分隔符，可以使用 tauri/api/path 中的 join
  if (!dirPath) {
    return baseName; // 如果没有目录路径，直接返回基础名称
  }
  return `${dirPath}/${baseName}`;
} 