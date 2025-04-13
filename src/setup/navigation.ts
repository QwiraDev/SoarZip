import { openArchive } from "../services/fileService";
import { showError, showSuccess } from "../ui/notification";

// Type for dependencies needed by navigation setup
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

export function setupNavButtons(deps: NavigationDependencies): void {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  const refreshBtn = document.querySelector('.nav-btn[title="刷新"]');
  
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
      
      showSuccess("刷新完成");
    } catch (error) {
      console.error('刷新失败:', error);
      showError(`刷新失败: ${error}`);
    } finally {
      deps.updateLoadingStatus(false);
    }
  });
} 