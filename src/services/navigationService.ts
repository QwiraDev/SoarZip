/**
 * Navigation Service Module - Handles navigation history and path management
 * 导航服务模块 - 处理导航历史和路径管理
 */

/**
 * Class that manages navigation history for browsing archives
 * 管理压缩包浏览的导航历史的类
 */
class NavigationHistory {
  private history: string[] = [];
  private currentIndex: number = -1;

  /**
   * Adds a new path to the history
   * 添加新路径到历史记录
   * 
   * @param path - Path to add to history
   *             - 要添加到历史记录的路径
   */
  addPath(path: string): void {
    // If not at the end of history, truncate the future history
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    // Only add if the path is different from current
    if (this.history[this.currentIndex] !== path) {
      this.history.push(path);
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Gets the previous path in history (moves back in history)
   * 获取历史中的上一个路径（在历史中后退）
   * 
   * @returns - Previous path or null if at the beginning
   *          - 上一个路径，如果已在开头则返回null
   */
  getPreviousPath(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Gets the next path in history (moves forward in history)
   * 获取历史中的下一个路径（在历史中前进）
   * 
   * @returns - Next path or null if at the end
   *          - 下一个路径，如果已在末尾则返回null
   */
  getNextPath(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Gets the parent folder path of the current path
   * 获取当前路径的父文件夹路径
   * 
   * @param currentPath - Current path to find the parent of
   *                    - 要查找父级的当前路径
   * @returns - Parent folder path
   *          - 父文件夹路径
   */
  getParentPath(currentPath: string): string {
    if (!currentPath) return "";
    
    // Remove trailing slash if present
    const normalizedPath = currentPath.endsWith('/') 
      ? currentPath.slice(0, -1) 
      : currentPath;
    
    // Find position of last slash
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    // If no slash found, return empty string (root directory)
    if (lastSlashIndex < 0) return "";
    
    // If slash is at beginning, return root
    if (lastSlashIndex === 0) return "/";
    
    // Return portion up to the last slash
    return normalizedPath.substring(0, lastSlashIndex) + '/';
  }

  /**
   * Resets navigation history with an optional initial path
   * 使用可选的初始路径重置导航历史
   * 
   * @param initialPath - Path to initialize history with
   *                    - 用于初始化历史的路径
   */
  reset(initialPath: string = ""): void {
    this.history = [initialPath];
    this.currentIndex = 0;
  }

  /**
   * Checks if navigation can go back
   * 检查导航是否可以后退
   * 
   * @returns - True if there are previous entries in history
   *          - 如果历史中有前面的条目则返回true
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Checks if navigation can go forward
   * 检查导航是否可以前进
   * 
   * @returns - True if there are later entries in history
   *          - 如果历史中有后面的条目则返回true
   */
  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Gets the current path from history
   * 从历史中获取当前路径
   * 
   * @returns - Current path or empty string if history is empty
   *          - 当前路径，如果历史为空则返回空字符串
   */
  getCurrentPath(): string {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return "";
  }
}

// Export the singleton instance
export const navigationHistory = new NavigationHistory();

/**
 * Normalizes folder paths for consistent handling
 * 标准化文件夹路径以实现一致的处理
 * 
 * @param folderPath - Folder path to normalize
 *                   - 要标准化的文件夹路径
 * @returns - Normalized path
 *          - 标准化后的路径
 */
export function normalizeFolderPath(folderPath: string): string {
  // Ensure empty path returns empty string (root directory)
  if (!folderPath) return '';
  
  // Remove extra leading slashes
  let normalizedPath = folderPath.replace(/^\/+/, '');
  
  // Ensure non-empty paths end with slash
  if (normalizedPath && !normalizedPath.endsWith('/')) {
    normalizedPath += '/';
  }
  
  return normalizedPath;
}

/**
 * Updates the enabled/disabled state of navigation buttons in the UI
 * 更新UI中导航按钮的启用/禁用状态
 */
export function updateNavButtonsState(): void {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  
  // Remove all disabled states initially
  document.querySelectorAll('.nav-btn').forEach(btn => {
    (btn as HTMLElement).classList.remove('disabled');
  });
  
  // Update back button state
  if (backBtn) {
    if (navigationHistory.canGoBack()) {
      backBtn.classList.remove('disabled');
    } else {
      backBtn.classList.add('disabled');
    }
  }
  
  // Update forward button state
  if (forwardBtn) {
    if (navigationHistory.canGoForward()) {
      forwardBtn.classList.remove('disabled');
    } else {
      forwardBtn.classList.add('disabled');
    }
  }
  
  // Update up button state
  if (upBtn) {
    const currentPath = navigationHistory.getCurrentPath();
    if (currentPath) {
      upBtn.classList.remove('disabled');
    } else {
      upBtn.classList.add('disabled');
    }
  }
} 