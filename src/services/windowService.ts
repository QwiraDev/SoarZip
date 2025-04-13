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
export function setWindowTitle(title: string): void {
  const currentFile = document.getElementById('current-file');
  if (currentFile) {
    currentFile.textContent = title;
  }
}

/**
 * 从文件路径中提取文件名
 * @param filePath 文件路径
 * @returns 文件名
 */
export function getFileNameFromPath(filePath: string): string {
  return filePath.split(/[\/\\]/).pop() || '未打开文件';
} 