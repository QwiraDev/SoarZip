/**
 * Theme Service Module - Handles theme settings and application
 * 主题服务模块 - 处理主题设置和应用
 */

/**
 * Theme mode type definition
 * 主题模式类型定义
 */
export type ThemeMode = 'light' | 'dark' | 'system';

// Local storage key for theme settings
const THEME_STORAGE_KEY = 'soar-zip-theme-mode';

/**
 * Gets the current system theme preference
 * 获取当前系统主题偏好
 * 
 * @returns - 'dark' if system is in dark mode, otherwise 'light'
 *          - 如果系统处于深色模式返回'dark'，否则返回'light'
 */
function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Loads the user's saved theme preference from local storage
 * 从本地存储加载用户保存的主题偏好
 * 
 * @returns - The saved theme mode or 'system' if none found
 *          - 保存的主题模式，如果未找到则返回'system'
 */
export function loadSavedTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return (savedTheme as ThemeMode) || 'system';
}

/**
 * Saves the theme preference to local storage
 * 将主题偏好保存到本地存储
 * 
 * @param mode - The theme mode to save
 *             - 要保存的主题模式
 */
export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

/**
 * Applies the selected theme to the document
 * 将选定的主题应用到文档
 * 
 * Resolves 'system' to the actual system theme and 
 * updates CSS classes and meta tags
 * 将'system'解析为实际的系统主题并更新CSS类和meta标签
 * 
 * @param mode - The theme mode to apply
 *             - 要应用的主题模式
 */
export function applyTheme(mode: ThemeMode): void {
  const actualTheme = mode === 'system' ? getSystemTheme() : mode;
  
  console.log(`[themeService] Applying theme: ${mode} (actual: ${actualTheme})`);
  
  // Remove previous theme classes
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  
  // Add new theme class
  document.documentElement.classList.add(`theme-${actualTheme}`);
  
  // Update meta tag for system theme integration
  updateThemeMetaTag(actualTheme);
  
  // Save setting if changed
  if (mode !== loadSavedTheme()) {
    saveThemeMode(mode);
  }
  
  // Dispatch event for component reactions
  dispatchThemeChangeEvent(actualTheme);
}

/**
 * Updates the theme-color meta tag for browser UI integration
 * 更新theme-color元标签以集成浏览器UI
 * 
 * @param theme - The actual theme being applied
 *              - 正在应用的实际主题
 */
function updateThemeMetaTag(theme: 'light' | 'dark'): void {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  
  // Set theme color value based on light/dark mode
  const color = theme === 'dark' ? '#1e1e1e' : '#f9f9f9';
  metaThemeColor.setAttribute('content', color);
}

/**
 * Dispatches a custom event when theme changes
 * 在主题更改时触发自定义事件
 * 
 * @param theme - The actual theme being applied
 *              - 正在应用的实际主题
 */
function dispatchThemeChangeEvent(theme: 'light' | 'dark'): void {
  const event = new CustomEvent('themechange', { 
    detail: { theme },
    bubbles: true 
  });
  document.documentElement.dispatchEvent(event);
}

/**
 * Initializes the theme system
 * 初始化主题系统
 * 
 * Loads saved preferences, applies theme, and sets up system theme change listeners
 * 加载保存的偏好，应用主题，并设置系统主题变化监听器
 */
export function initializeTheme(): void {
  console.log("[themeService] Initializing theme...");
  const savedTheme = loadSavedTheme();
  applyTheme(savedTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = loadSavedTheme();
    console.log(`[themeService] System theme changed: ${e.matches ? 'dark' : 'light'}`);
    
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
} 