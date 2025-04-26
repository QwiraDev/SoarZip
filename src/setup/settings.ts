/**
 * Settings Button Setup Module - Configures the settings button handler
 * 设置按钮处理模块 - 配置设置按钮的处理程序
 */
import { showSettingsPanel } from '../ui/settingsPanel';

/**
 * Interface for dependencies needed by settings button setup
 * 设置按钮设置所需的依赖项接口
 */
export interface SettingsDependencies {
  // Dependencies that might be needed in the future
}

/**
 * Sets up event handler for the settings button
 * 设置设置按钮的事件处理程序
 * 
 * @param _dependencies - Dependencies needed for settings actions
 *                      - 设置操作所需的依赖项
 */
export function setupSettingsButton(_dependencies: SettingsDependencies): void {
  console.log("Setting up settings button...");
  const settingsBtn = document.getElementById('settings-btn');
  
  if (!settingsBtn) {
    console.error("Settings button not found!");
    return;
  }
  
  settingsBtn.addEventListener('click', () => {
    console.log("Settings button clicked"); 
    showSettingsPanel();
  });
  
  console.log("Settings button setup complete.");
} 