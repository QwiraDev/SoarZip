/**
 * Settings Panel UI - Creates and manages the application settings modal panel.
 * 设置面板UI - 创建和管理应用程序设置模态面板。
 */
import { ThemeMode, loadSavedTheme, applyTheme } from '../services/themeService';
import { showSuccess } from './notification';

// Flag to track if the settings panel is currently open.
let isSettingsPanelOpen = false;

/**
 * Creates the HTML structure for the Settings Panel.
 * Dynamically builds the panel elements, sidebar navigation, content sections,
 * and attaches necessary event listeners.
 * 
 * 创建设置面板的HTML结构。
 * 动态构建面板元素、侧边栏导航、内容部分，并附加必要的事件侦听器。
 * 
 * @returns - The HTMLElement representing the Settings Panel.
 *          - 表示设置面板的HTMLElement。
 */
function createSettingsPanel(): HTMLElement {
  // Create the main panel container
  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.className = 'settings-panel'; // Base class for styling
  
  // --- Create Header --- 
  const header = document.createElement('div');
  header.className = 'settings-header';
  
  const title = document.createElement('h2');
  title.textContent = '设置'; // Panel title
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'settings-close-btn';
  // SVG icon for the close button
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 4 L12 12 M4 12 L12 4" />
    </svg>
  `;
  closeBtn.addEventListener('click', hideSettingsPanel); // Add click listener
  closeBtn.setAttribute('title', '关闭'); // Tooltip
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);
  
  // --- Create Main Content Area --- 
  const content = document.createElement('div');
  content.className = 'settings-content'; // For potential overall content styling
  
  // Container for sidebar and main section
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'settings-container'; // Flex container
  
  // --- Create Sidebar Navigation --- 
  const sidebar = document.createElement('div');
  sidebar.className = 'settings-sidebar';
  
  // Define navigation items (ID, Label, Icon SVG)
  const navItems = [
    { id: 'appearance', label: '外观', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' },
    { id: 'general', label: '常规', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' },
    { id: 'advanced', label: '高级', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>' }
  ];
  
  // Create sidebar items dynamically
  navItems.forEach(item => {
    const navItem = document.createElement('div');
    // Set class, make 'appearance' active by default
    navItem.className = `settings-nav-item ${item.id === 'appearance' ? 'active' : ''}`;
    navItem.dataset.section = item.id; // Store section ID for click handling
    
    const icon = document.createElement('span');
    icon.className = 'settings-nav-icon';
    icon.innerHTML = item.icon;
    
    const label = document.createElement('span');
    label.className = 'settings-nav-label';
    label.textContent = item.label;
    
    navItem.appendChild(icon);
    navItem.appendChild(label);
    
    // Add click listener to handle section switching
    navItem.addEventListener('click', () => {
      // Deactivate all nav items
      document.querySelectorAll('.settings-nav-item').forEach(nav => {
        nav.classList.remove('active');
      });
      // Activate the clicked nav item
      navItem.classList.add('active');
      
      // Hide all content sections
      document.querySelectorAll<HTMLElement>('.settings-section').forEach(section => {
        section.classList.remove('active'); // Hide section
        // section.style.display = 'none'; // Alternative: use display none/block
      });
      // Show the corresponding content section
      const targetSection = document.getElementById(`settings-${item.id}`);
      if (targetSection) {
        targetSection.classList.add('active'); // Show section with animation
        // targetSection.style.display = 'block';
      }
    });
    
    sidebar.appendChild(navItem);
  });
  
  // --- Create Main Settings Content Area --- 
  const mainContent = document.createElement('div');
  mainContent.className = 'settings-main-content'; // For padding and scroll overflow
  
  // --- Appearance Section --- 
  const appearanceSection = document.createElement('div');
  appearanceSection.id = 'settings-appearance';
  // Make 'appearance' section active by default
  appearanceSection.className = 'settings-section active';
  
  const appearanceTitle = document.createElement('h3');
  appearanceTitle.textContent = '外观';
  appearanceSection.appendChild(appearanceTitle);
  
  // Theme Selection Dropdown
  const themeFormGroup = document.createElement('div');
  themeFormGroup.className = 'settings-form-group'; // Styling container
  
  const themeLabel = document.createElement('label');
  themeLabel.htmlFor = 'theme-select';
  themeLabel.textContent = '主题模式';
  
  const themeSelect = document.createElement('select');
  themeSelect.id = 'theme-select';
  themeSelect.className = 'settings-select'; // For styling the dropdown
  
  // Get the currently saved theme to set the default selection
  const currentTheme = loadSavedTheme();
  
  // Define available theme options
  const themes: Array<{value: ThemeMode, label: string}> = [
    { value: 'light', label: '浅色模式' },
    { value: 'dark', label: '深色模式' },
    { value: 'system', label: '跟随系统' }
  ];
  
  // Populate the dropdown options
  themes.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.value;
    option.textContent = theme.label;
    // Set the currently active theme as selected
    if (theme.value === currentTheme) {
      option.selected = true;
    }
    themeSelect.appendChild(option);
  });
  
  // Add change listener to apply selected theme
  themeSelect.addEventListener('change', () => {
    selectTheme(themeSelect.value as ThemeMode);
  });
  
  themeFormGroup.appendChild(themeLabel);
  themeFormGroup.appendChild(themeSelect);
  
  // Description text for the theme setting
  const themeDescription = document.createElement('p');
  themeDescription.className = 'settings-description';
  themeDescription.textContent = '选择您喜欢的界面主题。系统模式将根据您的系统设置自动切换明暗主题。';
  
  // Add theme controls and description to the appearance section
  appearanceSection.appendChild(themeFormGroup);
  appearanceSection.appendChild(themeDescription);
  mainContent.appendChild(appearanceSection); // Add appearance section to main content
  
  // --- General Section (Placeholder) --- 
  const generalSection = document.createElement('div');
  generalSection.id = 'settings-general';
  generalSection.className = 'settings-section'; // Initially hidden
  
  const generalTitle = document.createElement('h3');
  generalTitle.textContent = '常规';
  generalSection.appendChild(generalTitle);
  
  // Placeholder content for unimplemented section
  const placeholderGeneral = document.createElement('p');
  placeholderGeneral.className = 'settings-empty-placeholder';
  placeholderGeneral.textContent = '此部分的设置尚未实现';
  generalSection.appendChild(placeholderGeneral);
  
  mainContent.appendChild(generalSection); // Add general section to main content
  
  // --- Advanced Section (Placeholder) --- 
  const advancedSection = document.createElement('div');
  advancedSection.id = 'settings-advanced';
  advancedSection.className = 'settings-section'; // Initially hidden
  
  const advancedTitle = document.createElement('h3');
  advancedTitle.textContent = '高级';
  advancedSection.appendChild(advancedTitle);
  
  // Placeholder content for unimplemented section
  const placeholderAdvanced = document.createElement('p');
  placeholderAdvanced.className = 'settings-empty-placeholder';
  placeholderAdvanced.textContent = '高级设置功能尚未实现';
  advancedSection.appendChild(placeholderAdvanced);
  
  mainContent.appendChild(advancedSection); // Add advanced section to main content
  
  // --- Assemble the Panel --- 
  // Add sidebar and main content to the settings container
  settingsContainer.appendChild(sidebar);
  settingsContainer.appendChild(mainContent);
  // Add the container to the scrollable content area
  content.appendChild(settingsContainer);
  // Add the content area to the main panel
  panel.appendChild(content);
  
  return panel; // Return the fully constructed panel element
}

/**
 * Handles theme selection changes.
 * Applies the selected theme using the theme service and shows a confirmation notification.
 * 
 * 处理主题选择更改。
 * 使用主题服务应用所选主题，并显示确认通知。
 * 
 * @param theme - The selected theme mode ('light', 'dark', or 'system').
 *              - 所选的主题模式（'light'， 'dark' 或 'system'）。
 */
function selectTheme(theme: ThemeMode): void {
  // Call the theme service to apply and save the theme
  applyTheme(theme);
  
  // Get a user-friendly theme name for the notification
  const themeName = theme === 'light' 
    ? '浅色模式' 
    : theme === 'dark' 
      ? '深色模式' 
      : '系统模式';
      
  // Show a success notification to confirm the change
  showSuccess(`已切换到${themeName}`);
}

/**
 * Displays the Settings Panel.
 * Creates the panel if needed, adds it and the overlay to the DOM,
 * and triggers the opening animation.
 * 
 * 显示设置面板。
 * 如果需要，创建面板，将其和遮罩层添加到DOM中，并触发展开动画。
 */
export function showSettingsPanel(): void {
  if (isSettingsPanelOpen) {
    // If already open, do nothing
    return;
  }
  
  // Create the settings panel element
  const panel = createSettingsPanel();
  document.body.appendChild(panel);
  
  // Create and add the overlay element
  const overlay = document.createElement('div');
  overlay.id = 'settings-overlay';
  overlay.className = 'settings-overlay';
  overlay.addEventListener('click', hideSettingsPanel); // Clicking overlay closes panel
  document.body.appendChild(overlay);
  
  // Trigger opening animation using requestAnimationFrame
  requestAnimationFrame(() => {
    panel.classList.add('open');
    overlay.classList.add('open');
  });
  
  isSettingsPanelOpen = true; // Set flag
}

/**
 * Hides the Settings Panel.
 * Triggers the closing animation and removes the panel and overlay from the DOM
 * after the animation completes.
 * 
 * 隐藏设置面板。
 * 触发展开动画，并在动画完成后从DOM中移除面板和遮罩层。
 */
export function hideSettingsPanel(): void {
  if (!isSettingsPanelOpen) {
    // If already closed or closing, do nothing
    return;
  }
  
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  
  if (panel && overlay) {
    // Set flag immediately to prevent re-entry
    isSettingsPanelOpen = false; 
    
    // Trigger closing animation
    panel.classList.remove('open');
    overlay.classList.remove('open');
    
    // --- Cleanup after transition --- 
    // Function to remove elements
    const removeElements = () => {
      if (panel.parentNode) {
        panel.remove();
      }
      if (overlay.parentNode) {
        overlay.remove();
      }
    };

    // Listener for 'transitionend' on the panel
    const transitionHandler = (e: TransitionEvent) => {
      // Ensure it's the panel's opacity transition ending
      if (e.target === panel && e.propertyName === 'opacity') {
        removeElements(); // Remove after transition
      }
    };
    
    panel.addEventListener('transitionend', transitionHandler);
    
    // Fallback timeout for cleanup
    setTimeout(() => {
      // Check if elements still exist and panel is marked as closed
      if (!isSettingsPanelOpen && (panel.parentNode || overlay.parentNode)) {
        console.warn('Settings panel transitionend fallback triggered.');
        removeElements();
      }
    }, 300); // Timeout slightly longer than CSS transition
  }
} 