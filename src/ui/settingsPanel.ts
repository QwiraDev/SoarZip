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
  
  // 主侧边栏导航
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'settings-container';
  
  // 侧边栏导航
  const sidebar = document.createElement('div');
  sidebar.className = 'settings-sidebar';
  
  const navItems = [
    { id: 'appearance', label: '外观', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' },
    { id: 'general', label: '常规', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' },
    { id: 'advanced', label: '高级', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>' }
  ];
  
  navItems.forEach(item => {
    const navItem = document.createElement('div');
    navItem.className = `settings-nav-item ${item.id === 'appearance' ? 'active' : ''}`;
    navItem.dataset.section = item.id;
    
    const icon = document.createElement('span');
    icon.className = 'settings-nav-icon';
    icon.innerHTML = item.icon;
    
    const label = document.createElement('span');
    label.className = 'settings-nav-label';
    label.textContent = item.label;
    
    navItem.appendChild(icon);
    navItem.appendChild(label);
    
    navItem.addEventListener('click', () => {
      // 激活点击的导航项
      document.querySelectorAll('.settings-nav-item').forEach(nav => {
        nav.classList.remove('active');
      });
      navItem.classList.add('active');
      
      // 显示对应的设置部分
      document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(`settings-${item.id}`)?.classList.add('active');
    });
    
    sidebar.appendChild(navItem);
  });
  
  // 主设置区域
  const mainContent = document.createElement('div');
  mainContent.className = 'settings-main-content';
  
  // 外观设置部分
  const appearanceSection = document.createElement('div');
  appearanceSection.id = 'settings-appearance';
  appearanceSection.className = 'settings-section active';
  
  const appearanceTitle = document.createElement('h3');
  appearanceTitle.textContent = '外观';
  appearanceSection.appendChild(appearanceTitle);
  
  // 主题选择下拉菜单
  const themeFormGroup = document.createElement('div');
  themeFormGroup.className = 'settings-form-group';
  
  const themeLabel = document.createElement('label');
  themeLabel.htmlFor = 'theme-select';
  themeLabel.textContent = '主题模式';
  
  const themeSelect = document.createElement('select');
  themeSelect.id = 'theme-select';
  themeSelect.className = 'settings-select';
  
  const currentTheme = loadSavedTheme();
  
  const themes: Array<{value: ThemeMode, label: string}> = [
    { value: 'light', label: '浅色模式' },
    { value: 'dark', label: '深色模式' },
    { value: 'system', label: '跟随系统' }
  ];
  
  themes.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.value;
    option.textContent = theme.label;
    if (theme.value === currentTheme) {
      option.selected = true;
    }
    themeSelect.appendChild(option);
  });
  
  themeSelect.addEventListener('change', () => {
    selectTheme(themeSelect.value as ThemeMode);
  });
  
  themeFormGroup.appendChild(themeLabel);
  themeFormGroup.appendChild(themeSelect);
  
  const themeDescription = document.createElement('p');
  themeDescription.className = 'settings-description';
  themeDescription.textContent = '选择您喜欢的界面主题。系统模式将根据您的系统设置自动切换明暗主题。';
  
  appearanceSection.appendChild(themeFormGroup);
  appearanceSection.appendChild(themeDescription);
  mainContent.appendChild(appearanceSection);
  
  // 常规设置部分
  const generalSection = document.createElement('div');
  generalSection.id = 'settings-general';
  generalSection.className = 'settings-section';
  
  const generalTitle = document.createElement('h3');
  generalTitle.textContent = '常规';
  generalSection.appendChild(generalTitle);
  
  const placeholderGeneral = document.createElement('p');
  placeholderGeneral.className = 'settings-empty-placeholder';
  placeholderGeneral.textContent = '此部分的设置尚未实现';
  generalSection.appendChild(placeholderGeneral);
  
  mainContent.appendChild(generalSection);
  
  // 高级设置部分
  const advancedSection = document.createElement('div');
  advancedSection.id = 'settings-advanced';
  advancedSection.className = 'settings-section';
  
  const advancedTitle = document.createElement('h3');
  advancedTitle.textContent = '高级';
  advancedSection.appendChild(advancedTitle);
  
  const placeholderAdvanced = document.createElement('p');
  placeholderAdvanced.className = 'settings-empty-placeholder';
  placeholderAdvanced.textContent = '高级设置功能尚未实现';
  advancedSection.appendChild(placeholderAdvanced);
  
  mainContent.appendChild(advancedSection);
  
  // 组装设置容器
  settingsContainer.appendChild(sidebar);
  settingsContainer.appendChild(mainContent);
  content.appendChild(settingsContainer);
  panel.appendChild(content);
  
  return panel;
}

/**
 * 选择主题
 */
function selectTheme(theme: ThemeMode): void {
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
        removeElements();
      }
    }, 300);
  }
} 