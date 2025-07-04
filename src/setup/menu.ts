/**
 * Menu Setup Module - Configures the application menu system
 * 菜单设置模块 - 配置应用程序菜单系统
 */
import { showError } from '../ui/notification';
import { showAboutDialog } from '../ui/aboutDialog.ts';

/**
 * Interface for dependencies needed by menu setup
 * 菜单设置所需的依赖项接口
 */
export interface MenuDependencies {
  openArchiveDialog: () => Promise<void>;
}

/**
 * Sets up event handlers for menu items and dropdowns
 * 为菜单项和下拉菜单设置事件处理程序
 * 
 * @param deps - Dependencies needed for menu actions
 *             - 菜单操作所需的依赖项
 */
export function setupMenuItems(deps: MenuDependencies): void {
  // Handle main menu button clicks - show/hide dropdown
  const menuContainers = document.querySelectorAll('.menu-container');
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(menuItem => {
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      
      // Close all other open menus
      menuContainers.forEach(container => {
        if (container !== menuItem.parentElement) {
          container.querySelector('.dropdown-menu')?.classList.remove('show');
        }
      });
      
      // Toggle the display state of the current menu
      const dropdown = menuItem.parentElement?.querySelector('.dropdown-menu');
      dropdown?.classList.toggle('show');
    });
  });
  
  // Handle dropdown item clicks
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      // Prevent bubbling to avoid triggering parent element events
      e.stopPropagation();
      
      const itemText = (item as HTMLElement).textContent;
      console.log(`Menu item ${itemText} clicked`);
      
      // Close the currently open dropdown menu
      const dropdown = item.closest('.dropdown-menu');
      dropdown?.classList.remove('show');
      
      // Handle specific menu items
      if (itemText === '打开') {
        await deps.openArchiveDialog(); // Use injected dependency
      } else if (itemText === '新建压缩') {
        // Logic for creating a new archive (implement later)
        showError('该功能正在开发中...'); // showError can be imported directly
      } else if (itemText === '退出') {
        window.close(); // Directly use window API
      } else if (itemText === '关于') {
        showAboutDialog(); // Show about dialog
      }
      // Add handling for other menu items (Save, Save As, View options, etc.) here
    });
  });
  
  // Close all dropdown menus when clicking elsewhere on the page
  document.addEventListener('click', () => {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  });
} 