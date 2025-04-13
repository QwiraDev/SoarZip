/**
 * 导航服务模块 - 处理导航历史和路径
 */

// 导航历史记录
class NavigationHistory {
  private history: string[] = [];
  private currentIndex: number = -1;

  /**
   * 添加新路径到历史记录
   * @param path 路径
   */
  addPath(path: string): void {
    // 如果当前不在历史末尾，截断后面的历史
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    // 只有新路径与当前路径不同时才添加
    if (this.history[this.currentIndex] !== path) {
      this.history.push(path);
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * 获取上一个路径
   * @returns 上一个路径，如果没有则返回null
   */
  getPreviousPath(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * 获取下一个路径
   * @returns 下一个路径，如果没有则返回null
   */
  getNextPath(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * 获取父文件夹路径
   * @param currentPath 当前路径
   * @returns 父文件夹路径
   */
  getParentPath(currentPath: string): string {
    if (!currentPath) return "";
    
    // 移除末尾的斜杠（如果有）
    const normalizedPath = currentPath.endsWith('/') 
      ? currentPath.slice(0, -1) 
      : currentPath;
    
    // 找到最后一个斜杠的位置
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    // 如果找不到斜杠，返回空字符串（表示根目录）
    if (lastSlashIndex < 0) return "";
    
    // 如果斜杠在开头，则返回根目录
    if (lastSlashIndex === 0) return "/";
    
    // 返回截取到最后一个斜杠的部分
    return normalizedPath.substring(0, lastSlashIndex) + '/';
  }

  /**
   * 重置历史记录
   * @param initialPath 初始路径
   */
  reset(initialPath: string = ""): void {
    this.history = [initialPath];
    this.currentIndex = 0;
  }

  /**
   * 检查是否可以后退
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 检查是否可以前进
   */
  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 获取当前路径
   */
  getCurrentPath(): string {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return "";
  }
}

// 导出单例
export const navigationHistory = new NavigationHistory();

/**
 * 标准化文件夹路径
 * @param folderPath 文件夹路径
 * @returns 标准化后的路径
 */
export function normalizeFolderPath(folderPath: string): string {
  // 确保空路径返回空字符串（表示根目录）
  if (!folderPath) return '';
  
  // 移除开头的多余斜杠
  let normalizedPath = folderPath.replace(/^\/+/, '');
  
  // 确保非空路径末尾有斜杠
  if (normalizedPath && !normalizedPath.endsWith('/')) {
    normalizedPath += '/';
  }
  
  return normalizedPath;
}

/**
 * 更新导航按钮状态
 */
export function updateNavButtonsState(): void {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  
  // 移除所有禁用状态
  document.querySelectorAll('.nav-btn').forEach(btn => {
    (btn as HTMLElement).classList.remove('disabled');
  });
  
  if (backBtn) {
    if (navigationHistory.canGoBack()) {
      backBtn.classList.remove('disabled');
    } else {
      backBtn.classList.add('disabled');
    }
  }
  
  if (forwardBtn) {
    if (navigationHistory.canGoForward()) {
      forwardBtn.classList.remove('disabled');
    } else {
      forwardBtn.classList.add('disabled');
    }
  }
  
  if (upBtn) {
    const currentPath = navigationHistory.getCurrentPath();
    if (currentPath) {
      upBtn.classList.remove('disabled');
    } else {
      upBtn.classList.add('disabled');
    }
  }
} 