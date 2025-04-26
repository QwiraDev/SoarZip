/**
 * Navigation Setup Module - Configures navigation controls and buttons
 * 导航设置模块 - 配置导航控件和按钮
 */
import { openArchive } from "../services/fileService";
import { showError } from "../ui/notification";

/**
 * Interface for dependencies needed by navigation setup
 * 导航设置所需的依赖项接口
 */
export interface NavigationDependencies {
  isLoading: () => boolean;
  canGoBack: () => boolean;
  getPreviousPath: () => string | null;
  canGoForward: () => boolean;
  getNextPath: () => string | null;
  getCurrentPath: () => string;
  getParentPath: (path: string) => string;
  refreshUI: () => void;
  navigateToFolder: (folderPath: string) => void;
  // Combine refresh logic dependencies
  getArchivePath: () => string;
  updateLoadingStatus: (loading: boolean, message?: string) => void;
  setCurrentFiles: (files: any[]) => void; // Assuming FileItem type, adjust if needed
}

/**
 * Sets up click event handlers for navigation buttons
 * 为导航按钮设置点击事件处理程序
 * 
 * @param deps - Dependencies needed for navigation actions
 *             - 导航操作所需的依赖项
 */
export function setupNavButtons(deps: NavigationDependencies): void {
  const backBtn = document.querySelector('.nav-btn[title="Back"]');
  const forwardBtn = document.querySelector('.nav-btn[title="Forward"]');
  const upBtn = document.querySelector('.nav-btn[title="Up level"]');
  const refreshBtn = document.querySelector('.nav-btn[title="Refresh"]');
  
  // Back button click
  backBtn?.addEventListener('click', () => {
    if (deps.isLoading() || !deps.canGoBack()) return;
    
    const prevPath = deps.getPreviousPath();
    if (prevPath !== null) {
      // The history index is already updated by getPreviousPath
      deps.refreshUI(); 
    }
  });
  
  // Forward button click
  forwardBtn?.addEventListener('click', () => {
    if (deps.isLoading() || !deps.canGoForward()) return;
    
    const nextPath = deps.getNextPath();
    if (nextPath !== null) {
      // The history index is already updated by getNextPath
      deps.refreshUI();
    }
  });
  
  // Up button click
  upBtn?.addEventListener('click', () => {
    if (deps.isLoading()) return;
    
    const currentPath = deps.getCurrentPath();
    if (currentPath) {
      const parentPath = deps.getParentPath(currentPath);
      deps.navigateToFolder(parentPath);
    }
  });
  
  // Refresh button click
  refreshBtn?.addEventListener('click', async () => {
    const archivePath = deps.getArchivePath();
    if (deps.isLoading() || !archivePath) return;
    
    try {
      deps.updateLoadingStatus(true, "正在刷新...");
      
      // Reload the current archive
      const files = await openArchive(archivePath);
      deps.setCurrentFiles(files); // Update files in main.ts state
      
      // Refresh UI
      deps.refreshUI();
      
      // Remove refresh success message
      // showSuccess("刷新完成"); 
    } catch (error) {
      console.error('刷新失败:', error);
      showError(`刷新失败: ${error}`);
    } finally {
      deps.updateLoadingStatus(false);
    }
  });
} 