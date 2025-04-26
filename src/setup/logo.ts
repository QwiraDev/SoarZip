/**
 * Logo Setup Module - Configures the logo click behavior
 * Logo设置模块 - 配置logo点击行为
 */

// Import the logo image asset
// Adjust the relative path if necessary based on your project structure
import logoSrc from '../../src-tauri/icons/icon.png'; 
import { showConfirmDialog } from '../ui/confirmDialog'; // Import the custom confirm dialog

/**
 * Interface for dependencies needed by logo click handler
 * Logo点击处理程序所需的依赖项接口
 */
export interface LogoClickDependencies {
  getArchivePath: () => string;
  resetApp: () => void;
}

/**
 * Sets up click event handler for the application logo
 * 设置应用程序logo的点击事件处理程序
 * 
 * @param deps - Dependencies needed for logo click actions
 *             - Logo点击操作所需的依赖项
 */
export function setupLogoClick(deps: LogoClickDependencies): void {
  const logoElement = document.querySelector('.logo');
  const logoImg = logoElement?.querySelector('img'); // Find the img tag within the logo element

  // Set the image source dynamically
  if (logoImg instanceof HTMLImageElement) {
    logoImg.src = logoSrc;
  } else if (logoElement) {
    // Log an error if the img tag isn't found inside .logo
    console.error('Could not find the <img> tag within the .logo element.');
  }

  // Attach the click event listener
  logoElement?.addEventListener('click', () => {
    if (deps.getArchivePath()) {
      // If an archive is open, ask for confirmation using the custom dialog
      showConfirmDialog(
        '确认返回主页吗？当前压缩包的浏览进度将丢失。', 
        () => {
          // On confirm, call resetApp
          deps.resetApp();
        },
        // On cancel, do nothing (optional cancel callback)
        () => {
          console.log('Return to home cancelled by user.');
        }
      );
    }
    // If no archive is open, clicking the logo does nothing.
  });
}
