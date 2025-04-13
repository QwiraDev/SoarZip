/**
 * 设置面板UI
 */
import { ThemeMode, loadSavedTheme, applyTheme } from '../services/themeService';
import { showSuccess } from './notification';

// 记录设置面板是否已打开
let isSettingsPanelOpen = false;

/**
 * 创建设置面板HTML
 */
function createSettingsPanel(): HTMLElement {
  // 创建面板容器
  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.className = 'settings-panel';
  
  // 创建标题和关闭按钮
  const header = document.createElement('div');
  header.className = 'settings-header';
  
  const title = document.createElement('h2');
  title.textContent = '设置';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'settings-close-btn';
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 4 L12 12 M4 12 L12 4" />
    </svg>
  `;
  closeBtn.addEventListener('click', hideSettingsPanel);
  closeBtn.setAttribute('title', '关闭');
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);
  
  // 创建设置内容
  const content = document.createElement('div');
  content.className = 'settings-content';
  
  // 主题设置部分
  const themeSection = document.createElement('div');
  themeSection.className = 'settings-section';
  
  const themeTitle = document.createElement('h3');
  themeTitle.textContent = '外观';
  themeSection.appendChild(themeTitle);
  
  // 主题选择器
  const themeSelector = document.createElement('div');
  themeSelector.className = 'theme-selector';
  
  const currentTheme = loadSavedTheme();
  
  const themes: Array<{value: ThemeMode, label: string, icon: string}> = [
    {
      value: 'light',
      label: '浅色模式',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    },
    {
      value: 'dark',
      label: '深色模式',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    },
    {
      value: 'system',
      label: '跟随系统',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
    }
  ];
  
  themes.forEach(theme => {
    const option = document.createElement('div');
    option.className = `theme-option ${theme.value === currentTheme ? 'selected' : ''}`;
    option.dataset.theme = theme.value;
    option.setAttribute('title', theme.label);
    
    const icon = document.createElement('span');
    icon.className = 'theme-icon';
    icon.innerHTML = theme.icon;
    
    const label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = theme.label;
    
    option.appendChild(icon);
    option.appendChild(label);
    
    option.addEventListener('click', () => selectTheme(theme.value as ThemeMode));
    
    themeSelector.appendChild(option);
  });
  
  const themeDescription = document.createElement('p');
  themeDescription.className = 'settings-description';
  themeDescription.textContent = '选择您喜欢的界面主题。系统模式将根据您的系统设置自动切换明暗主题。';
  
  themeSection.appendChild(themeSelector);
  themeSection.appendChild(themeDescription);
  content.appendChild(themeSection);
  
  // 添加其他设置部分的占位符 (未来可扩展)
  const otherSection = document.createElement('div');
  otherSection.className = 'settings-section';
  
  const otherTitle = document.createElement('h3');
  otherTitle.textContent = '关于';
  otherSection.appendChild(otherTitle);
  
  const aboutContent = document.createElement('div');
  aboutContent.className = 'about-content';
  aboutContent.innerHTML = `
    <p>Soar Zip 版本: 0.1.0</p>
    <p>高效、安全的压缩文件管理工具</p>
    <p class="copyright">© 2025 QwiraDev. 保留所有权利。</p>
  `;
  
  otherSection.appendChild(aboutContent);
  content.appendChild(otherSection);
  
  panel.appendChild(content);
  
  // 创建底部按钮
  const footer = document.createElement('div');
  footer.className = 'settings-footer';
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'settings-save-btn';
  saveBtn.textContent = '关闭';
  saveBtn.addEventListener('click', hideSettingsPanel);
  
  footer.appendChild(saveBtn);
  panel.appendChild(footer);
  
  return panel;
}

/**
 * 选择主题
 */
function selectTheme(theme: ThemeMode): void {
  // 更新选中状态
  const options = document.querySelectorAll('.theme-option');
  options.forEach(option => {
    if (option instanceof HTMLElement) {
      if (option.dataset.theme === theme) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    }
  });
  
  // 应用主题
  applyTheme(theme);
  
  // 显示适当的成功提示
  const themeName = theme === 'light' 
    ? '浅色模式' 
    : theme === 'dark' 
      ? '深色模式' 
      : '系统模式';
      
  showSuccess(`已切换到${themeName}`);
}

/**
 * 显示设置面板
 */
export function showSettingsPanel(): void {
  if (isSettingsPanelOpen) {
    return;
  }
  
  // 创建设置面板
  const panel = createSettingsPanel();
  document.body.appendChild(panel);
  
  // 添加遮罩
  const overlay = document.createElement('div');
  overlay.id = 'settings-overlay';
  overlay.className = 'settings-overlay';
  overlay.addEventListener('click', hideSettingsPanel);
  document.body.appendChild(overlay);
  
  // 移除预先设置动画的起始状态和强制重绘
  // panel.style.opacity = '0';
  // panel.style.transform = 'translate(-50%, -50%) scale(0.95)';
  // overlay.style.opacity = '0';
  // window.getComputedStyle(panel).opacity;
  // window.getComputedStyle(overlay).opacity;
  
  // 显示动画 - 使用 requestAnimationFrame 确保 DOM 更新后再添加类
  requestAnimationFrame(() => {
    panel.classList.add('open');
    overlay.classList.add('open');
  });
  
  isSettingsPanelOpen = true;
}

/**
 * 隐藏设置面板
 */
export function hideSettingsPanel(): void {
  if (!isSettingsPanelOpen) {
    return;
  }
  
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  
  if (panel && overlay) {
    // 标记为正在关闭，防止重复触发
    isSettingsPanelOpen = false; 
    
    // 隐藏动画
    panel.classList.remove('open');
    overlay.classList.remove('open');
    
    // 监听动画结束后移除元素
    const removeElements = () => {
      if (panel.parentNode) {
        panel.remove();
      }
      if (overlay.parentNode) {
        overlay.remove();
      }
      // 确保即使在超时后，如果事件触发了，状态也是正确的
      // isSettingsPanelOpen = false; // 移动到前面，防止重复关闭
      panel.removeEventListener('transitionend', transitionHandler);
    };

    const transitionHandler = (e: TransitionEvent) => {
      // 确保是面板的 opacity 过渡结束
      if (e.target === panel && e.propertyName === 'opacity') {
        removeElements();
      }
    };
    
    panel.addEventListener('transitionend', transitionHandler);
    
    // 为防止动画未触发或其他问题，添加超时保障
    setTimeout(() => {
      // 检查元素是否仍然存在，并且状态仍是未打开（防止在超时期间又被打开）
      if (!isSettingsPanelOpen && (panel.parentNode || overlay.parentNode)) {
        console.warn("Settings panel transitionend event might not have fired. Removing elements via timeout.");
        removeElements();
      }
    }, 400); // 稍长于过渡时间 (0.3s)
  } else {
    // 如果元素已经不存在，直接重置状态
    isSettingsPanelOpen = false; 
  }
} 