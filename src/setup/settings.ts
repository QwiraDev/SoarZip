/**
 * 设置按钮处理模块
 */
import { showSettingsPanel } from '../ui/settingsPanel';

export interface SettingsDependencies {
  // 未来可能需要的依赖项
}

/**
 * 设置设置按钮的处理程序
 */
export function setupSettingsButton(dependencies: SettingsDependencies): void {
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