/**
 * Home Page Setup Module - Configures actions for the home page
 * 主页设置模块 - 配置主页的操作
 */
import { showError } from '../ui/notification';

/**
 * Interface for dependencies needed by home page actions
 * 主页操作所需的依赖项接口
 */
export interface HomeActionDependencies {
  openArchiveDialog: () => Promise<void>;
}

/**
 * Sets up event handlers for home page action buttons
 * 为主页操作按钮设置事件处理程序
 * 
 * @param deps - Dependencies needed for home actions
 *             - 主页操作所需的依赖项
 */
export function setupHomeActions(deps: HomeActionDependencies): void {
  console.log("Setting up home actions..."); // Log setup start
  const openArchiveBtn = document.getElementById('open-archive-btn');
  const newArchiveBtn = document.getElementById('new-archive-btn');
  
  if (!openArchiveBtn) {
    console.error("Open archive button not found!");
  }
  if (!newArchiveBtn) {
    console.error("New archive button not found!");
  }
  
  openArchiveBtn?.addEventListener('click', () => {
    console.log("Open archive button clicked"); // Log click
    deps.openArchiveDialog();
  });
  
  newArchiveBtn?.addEventListener('click', () => {
    console.log("New archive button clicked"); // Log click
    // Logic for creating a new archive (implement later)
    showError('该功能正在开发中...');
  });
  console.log("Home actions setup complete."); // Log setup end
} 