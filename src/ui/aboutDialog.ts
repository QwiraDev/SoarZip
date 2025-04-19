/**
 * 关于对话框UI
 */
import { showSuccess } from './notification';

// 记录对话框是否已打开
let isAboutDialogOpen = false;

/**
 * 创建关于对话框HTML
 */
function createAboutDialog(): HTMLElement {
  // 创建对话框容器
  const dialog = document.createElement('div');
  dialog.id = 'about-dialog';
  dialog.className = 'about-dialog';
  
  // 创建标题和关闭按钮
  const header = document.createElement('div');
  header.className = 'about-header';
  
  const title = document.createElement('h2');
  title.textContent = '关于 Soar Zip';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'about-close-btn';
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 4 L12 12 M4 12 L12 4" />
    </svg>
  `;
  closeBtn.addEventListener('click', hideAboutDialog);
  closeBtn.setAttribute('title', '关闭');
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  dialog.appendChild(header);
  
  // 创建内容
  const content = document.createElement('div');
  content.className = 'about-content';
  
  // 添加徽标
  const logoContainer = document.createElement('div');
  logoContainer.className = 'about-logo';
  logoContainer.innerHTML = `<img src="/src-tauri/icons/icon.png" alt="Soar Zip Logo" />`;
  content.appendChild(logoContainer);
  
  // 添加应用信息
  const infoContainer = document.createElement('div');
  infoContainer.className = 'about-info';
  
  infoContainer.innerHTML = `
    <h3>Soar Zip</h3>
    <p class="version">版本: 0.1.0</p>
    <p class="description">高效、安全的压缩文件管理工具</p>
    <p class="copyright">© 2025 QwiraDev. 保留所有权利。</p>
  `;
  
  content.appendChild(infoContainer);
  
  // 技术信息部分
  const techInfo = document.createElement('div');
  techInfo.className = 'about-tech-info';
  
  techInfo.innerHTML = `
    <h4>技术详情</h4>
    <ul>
      <li>使用 Tauri 和 Rust 构建</li>
      <li>使用 TypeScript 和 Web 技术开发 UI</li>
      <li>7-Zip 提供压缩功能支持</li>
    </ul>
  `;
  
  content.appendChild(techInfo);
  
  dialog.appendChild(content);
  
  // 创建底部按钮
  const footer = document.createElement('div');
  footer.className = 'about-footer';
  
  const closeDialogBtn = document.createElement('button');
  closeDialogBtn.className = 'about-btn';
  closeDialogBtn.textContent = '关闭';
  closeDialogBtn.addEventListener('click', hideAboutDialog);
  
  const websiteBtn = document.createElement('button');
  websiteBtn.className = 'about-btn about-primary-btn';
  websiteBtn.textContent = '访问网站';
  websiteBtn.addEventListener('click', () => {
    // 模拟访问网站功能
    showSuccess('网站功能即将推出');
    hideAboutDialog();
  });
  
  footer.appendChild(closeDialogBtn);
  footer.appendChild(websiteBtn);
  dialog.appendChild(footer);
  
  return dialog;
}

/**
 * 显示关于对话框
 */
export function showAboutDialog(): void {
  if (isAboutDialogOpen) {
    return;
  }
  
  // 创建关于对话框
  const dialog = createAboutDialog();
  document.body.appendChild(dialog);
  
  // 添加遮罩
  const overlay = document.createElement('div');
  overlay.id = 'about-overlay';
  overlay.className = 'about-overlay';
  overlay.addEventListener('click', hideAboutDialog);
  document.body.appendChild(overlay);
  
  // 显示动画
  requestAnimationFrame(() => {
    dialog.classList.add('open');
    overlay.classList.add('open');
  });
  
  isAboutDialogOpen = true;
}

/**
 * 隐藏关于对话框
 */
export function hideAboutDialog(): void {
  if (!isAboutDialogOpen) {
    return;
  }
  
  const dialog = document.getElementById('about-dialog');
  const overlay = document.getElementById('about-overlay');
  
  if (dialog && overlay) {
    // 标记为正在关闭，防止重复触发
    isAboutDialogOpen = false; 
    
    // 隐藏动画
    dialog.classList.remove('open');
    overlay.classList.remove('open');
    
    // 监听动画结束后移除元素
    const removeElements = () => {
      if (dialog.parentNode) {
        dialog.remove();
      }
      if (overlay.parentNode) {
        overlay.remove();
      }
    };

    const transitionHandler = (e: TransitionEvent) => {
      // 确保是对话框的 opacity 过渡结束
      if (e.target === dialog && e.propertyName === 'opacity') {
        removeElements();
      }
    };
    
    dialog.addEventListener('transitionend', transitionHandler);
    
    // 为防止动画未触发或其他问题，添加超时保障
    setTimeout(() => {
      // 检查元素是否仍然存在，并且状态仍是未打开（防止在超时期间又被打开）
      if (!isAboutDialogOpen && (dialog.parentNode || overlay.parentNode)) {
        removeElements();
      }
    }, 300);
  }
} 