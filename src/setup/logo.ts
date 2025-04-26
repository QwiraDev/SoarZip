/**
 * Logo Setup Module - Configures the logo click behavior
 * Logo设置模块 - 配置logo点击行为
 */

// Import the logo image asset
// Adjust the relative path if necessary based on your project structure
import logoSrc from '../../src-tauri/icons/icon.png'; 

/**
 * Interface for dependencies needed by logo click handler
 * Logo点击处理程序所需的依赖项接口
 */
export interface LogoClickDependencies {
  getArchivePath: () => string;
  confirm: (message: string) => boolean;
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
      // If an archive is open, ask for confirmation to return to home
      if (deps.confirm('是否返回主页？当前压缩包将被关闭。')) {
        deps.resetApp();
      }
    }
    // If no archive is open, clicking the logo might do nothing or navigate to home directly
    // Current behavior: only acts if an archive is open.
  });
}
