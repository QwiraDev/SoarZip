/**
 * 主题服务模块 - 处理主题设置
 */

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system';

// 本地存储键
const THEME_STORAGE_KEY = 'soar-zip-theme-mode';

// 获取当前系统主题模式
function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 加载保存的主题设置
export function loadSavedTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return (savedTheme as ThemeMode) || 'system';
}

// 保存主题设置到本地存储
export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

// 应用主题到文档
export function applyTheme(mode: ThemeMode): void {
  const actualTheme = mode === 'system' ? getSystemTheme() : mode;
  
  console.log(`[themeService] 应用主题: ${mode} (实际: ${actualTheme})`);
  
  // 移除之前的主题
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  
  // 添加新主题
  document.documentElement.classList.add(`theme-${actualTheme}`);
  
  // 更新meta标签
  updateThemeMetaTag(actualTheme);
  
  // 保存设置
  if (mode !== loadSavedTheme()) {
    saveThemeMode(mode);
  }
  
  // 触发主题变更事件，便于组件响应
  dispatchThemeChangeEvent(actualTheme);
}

// 更新meta标签以支持系统级深色模式
function updateThemeMetaTag(theme: 'light' | 'dark'): void {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  
  // 设置主题颜色值
  const color = theme === 'dark' ? '#1e1e1e' : '#f9f9f9';
  metaThemeColor.setAttribute('content', color);
}

// 触发主题变更自定义事件
function dispatchThemeChangeEvent(theme: 'light' | 'dark'): void {
  const event = new CustomEvent('themechange', { 
    detail: { theme },
    bubbles: true 
  });
  document.documentElement.dispatchEvent(event);
}

// 初始化主题
export function initializeTheme(): void {
  console.log("[themeService] 初始化主题...");
  const savedTheme = loadSavedTheme();
  applyTheme(savedTheme);
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = loadSavedTheme();
    console.log(`[themeService] 系统主题变化: ${e.matches ? 'dark' : 'light'}`);
    
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
} 