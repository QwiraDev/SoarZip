/**
 * 通知模块 - 用于显示各类通知和错误信息
 */

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  duration?: number; // 显示时长（毫秒）
  closable?: boolean; // 是否可关闭
}

const defaultOptions: NotificationOptions = {
  duration: 5000,
  closable: true
};

// 最大显示通知数量
const MAX_NOTIFICATIONS = 5;

/**
 * 创建并显示通知
 * @param message 通知内容
 * @param type 通知类型
 * @param options 配置选项
 */
export function showNotification(
  message: string, 
  type: NotificationType = 'info', 
  options: NotificationOptions = {}
): void {
  // 合并默认选项
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 创建通知容器（如果不存在）
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  // 检查通知数量并移除最旧的通知（如果超过限制）
  if (container.children.length >= MAX_NOTIFICATIONS) {
    container.removeChild(container.firstChild as Node);
  }
  
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // 图标选择
  let icon = '';
  switch (type) {
    case 'info':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>`;
      break;
    case 'success':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>`;
      break;
    case 'warning':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>`;
      break;
    case 'error':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>`;
      break;
  }
  
  // 构建通知内容
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">${message}</div>
    ${mergedOptions.closable ? `
      <button class="notification-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    ` : ''}
  `;
  
  // 添加到容器
  container.appendChild(notification);
  
  // 添加关闭事件
  if (mergedOptions.closable) {
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      closeNotification(notification);
    });
  }
  
  // 显示动画
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 自动关闭
  if (mergedOptions.duration && mergedOptions.duration > 0) {
    setTimeout(() => {
      closeNotification(notification);
    }, mergedOptions.duration);
  }
}

/**
 * 关闭通知
 * @param notification 通知元素
 */
function closeNotification(notification: HTMLElement): void {
  notification.classList.add('hide');
  notification.classList.remove('show');
  
  // 等待动画结束后移除元素
  setTimeout(() => {
    notification.remove();
    
    // 如果没有更多通知，移除容器
    const container = document.getElementById('notification-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 300);
}

/**
 * 显示成功通知
 * @param message 通知内容
 * @param options 配置选项
 */
export function showSuccess(message: string, options?: NotificationOptions): void {
  showNotification(message, 'success', options);
}

/**
 * 显示信息通知
 * @param message 通知内容
 * @param options 配置选项
 */
export function showInfo(message: string, options?: NotificationOptions): void {
  showNotification(message, 'info', options);
}

/**
 * 显示警告通知
 * @param message 通知内容
 * @param options 配置选项
 */
export function showWarning(message: string, options?: NotificationOptions): void {
  showNotification(message, 'warning', options);
}

/**
 * 显示错误通知
 * @param message 通知内容
 * @param options 配置选项
 */
export function showError(message: string, options?: NotificationOptions): void {
  showNotification(message, 'error', {
    duration: 8000, // 错误通知显示时间更长
    ...options
  });
} 