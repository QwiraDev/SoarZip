/**
 * About Dialog UI - Creates and manages the 'About' modal dialog.
 * 关于对话框UI - 创建和管理"关于"模态对话框。
 */
import { showSuccess } from './notification';

// Flag to track if the dialog is currently open to prevent multiple instances.
let isAboutDialogOpen = false;

/**
 * Creates the HTML structure for the About dialog.
 * Dynamically builds the dialog elements and attaches event listeners.
 * 
 * 创建关于对话框的HTML结构。
 * 动态构建对话框元素并附加事件侦听器。
 * 
 * @returns - The HTMLElement representing the About dialog.
 *          - 表示关于对话框的HTMLElement。
 */
function createAboutDialog(): HTMLElement {
  // Create the main dialog container
  const dialog = document.createElement('div');
  dialog.id = 'about-dialog';
  dialog.className = 'about-dialog'; // CSS class for styling
  
  // --- Create Header --- 
  const header = document.createElement('div');
  header.className = 'about-header';
  
  const title = document.createElement('h2');
  title.textContent = '关于 Soar Zip'; // Dialog title
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'about-close-btn';
  // Add SVG icon for close button
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 4 L12 12 M4 12 L12 4" />
    </svg>
  `;
  closeBtn.addEventListener('click', hideAboutDialog); // Add click listener to hide
  closeBtn.setAttribute('title', '关闭'); // Tooltip
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  dialog.appendChild(header);
  
  // --- Create Content Area --- 
  const content = document.createElement('div');
  content.className = 'about-content';
  
  // Logo Section
  const logoContainer = document.createElement('div');
  logoContainer.className = 'about-logo';
  // Assuming the icon path is correct relative to the application structure
  logoContainer.innerHTML = `<img src="/src-tauri/icons/icon.png" alt="Soar Zip Logo" />`;
  content.appendChild(logoContainer);
  
  // Application Information Section
  const infoContainer = document.createElement('div');
  infoContainer.className = 'about-info';
  
  // Populate with app details (version, description, copyright)
  infoContainer.innerHTML = `
    <h3>Soar Zip</h3>
    <p class="version">版本: 0.1.0</p>
    <p class="description">高效、安全的压缩文件管理工具</p>
    <p class="copyright">© 2025 QwiraDev. 保留所有权利。</p>
  `;
  
  content.appendChild(infoContainer);
  
  // Technical Information Section
  const techInfo = document.createElement('div');
  techInfo.className = 'about-tech-info';
  
  // Populate with technical details (frameworks, libraries used)
  techInfo.innerHTML = `
    <h4>技术详情</h4>
    <ul>
      <li>使用 Tauri 和 Rust 构建</li>
      <li>使用 TypeScript 和 Web 技术开发 UI</li>
      <li>7-Zip 提供压缩功能支持</li>
    </ul>
  `;
  
  content.appendChild(techInfo);
  
  dialog.appendChild(content); // Add content area to the dialog
  
  // --- Create Footer --- 
  const footer = document.createElement('div');
  footer.className = 'about-footer';
  
  // Close Button in Footer
  const closeDialogBtn = document.createElement('button');
  closeDialogBtn.className = 'about-btn'; // Standard button style
  closeDialogBtn.textContent = '关闭';
  closeDialogBtn.addEventListener('click', hideAboutDialog);
  
  // Website Button (Primary Action)
  const websiteBtn = document.createElement('button');
  websiteBtn.className = 'about-btn about-primary-btn'; // Primary button style
  websiteBtn.textContent = '访问网站';
  websiteBtn.addEventListener('click', () => {
    // TODO: Implement actual website opening logic using Tauri API
    showSuccess('网站功能即将推出'); // Placeholder action
    hideAboutDialog(); // Close dialog after action
  });
  
  footer.appendChild(closeDialogBtn);
  footer.appendChild(websiteBtn);
  dialog.appendChild(footer); // Add footer to the dialog
  
  return dialog; // Return the fully constructed dialog element
}

/**
 * Displays the About dialog.
 * Creates the dialog if it doesn't exist, adds it and the overlay to the DOM,
 * and triggers the opening animation.
 * 
 * 显示关于对话框。
 * 如果对话框不存在则创建它，将其和遮罩层添加到DOM中，并触发展开动画。
 */
export function showAboutDialog(): void {
  if (isAboutDialogOpen) {
    // If already open, do nothing
    return;
  }
  
  // Create the dialog element
  const dialog = createAboutDialog();
  document.body.appendChild(dialog);
  
  // Create and add the overlay element
  const overlay = document.createElement('div');
  overlay.id = 'about-overlay';
  overlay.className = 'about-overlay';
  overlay.addEventListener('click', hideAboutDialog); // Clicking overlay closes dialog
  document.body.appendChild(overlay);
  
  // Trigger opening animation using requestAnimationFrame for smooth transition
  requestAnimationFrame(() => {
    dialog.classList.add('open');
    overlay.classList.add('open');
  });
  
  isAboutDialogOpen = true; // Set flag to true
}

/**
 * Hides the About dialog.
 * Triggers the closing animation and removes the dialog and overlay from the DOM
 * after the animation completes.
 * 
 * 隐藏关于对话框。
 * 触发展开动画，并在动画完成后从DOM中移除对话框和遮罩层。
 */
export function hideAboutDialog(): void {
  if (!isAboutDialogOpen) {
    // If already closed or closing, do nothing
    return;
  }
  
  const dialog = document.getElementById('about-dialog');
  const overlay = document.getElementById('about-overlay');
  
  if (dialog && overlay) {
    // Set flag immediately to prevent re-entry during animation
    isAboutDialogOpen = false; 
    
    // Trigger closing animation by removing 'open' classes
    dialog.classList.remove('open');
    overlay.classList.remove('open');
    
    // --- Cleanup after transition --- 
    // Function to remove elements from DOM
    const removeElements = () => {
      if (dialog.parentNode) {
        dialog.remove();
      }
      if (overlay.parentNode) {
        overlay.remove();
      }
    };

    // Event listener for the 'transitionend' event on the dialog
    const transitionHandler = (e: TransitionEvent) => {
      // Ensure the event is for the dialog's opacity transition ending
      if (e.target === dialog && e.propertyName === 'opacity') {
        removeElements(); // Remove elements once transition is complete
      }
    };
    
    dialog.addEventListener('transitionend', transitionHandler);
    
    // Fallback timeout to ensure cleanup even if transitionend doesn't fire
    // (e.g., if transitions are disabled or interrupted)
    setTimeout(() => {
      // Check if elements still exist and dialog is marked as closed
      if (!isAboutDialogOpen && (dialog.parentNode || overlay.parentNode)) {
        console.warn('About dialog transitionend fallback triggered.');
        removeElements();
      }
    }, 300); // Timeout slightly longer than CSS transition duration
  }
} 