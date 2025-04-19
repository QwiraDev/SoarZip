/**
 * 通知模块 - (Absolute Position + Manual Animation V2)
 */

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  duration?: number; 
  closable?: boolean; 
}

interface ActiveNotification {
  element: HTMLElement;
  timeoutId: number | null;
  currentBottom: number; // Stores the current 'bottom' value in px
}

const defaultOptions: NotificationOptions = {
  duration: 5000,
  closable: true,
};

const MAX_NOTIFICATIONS = 5;
const PUSH_UP_DURATION = 300; // ms
const DROP_DOWN_DURATION = 300; // ms
const ENTER_EXIT_DURATION = 300; // ms for slide in/out
const NOTIFICATION_GAP = 10; // px

const activeNotifications: ActiveNotification[] = [];

function getNotificationContainer(): HTMLElement {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 创建并显示通知 - 严格按照要求实现
 */
export function showNotification(
  message: string,
  type: NotificationType = 'info',
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...defaultOptions, ...options };
  const container = getNotificationContainer();

  // --- 处理旧通知 (Limit Check) --- 
  if (activeNotifications.length >= MAX_NOTIFICATIONS) {
    // 找到 currentBottom 最高的 (最顶部的)
    let highestBottom = -1;
    let oldestEntryIndex = -1;
    for(let i = 0; i < activeNotifications.length; i++) {
      if (activeNotifications[i].currentBottom > highestBottom) {
        highestBottom = activeNotifications[i].currentBottom;
        oldestEntryIndex = i;
      }
    }
    if (oldestEntryIndex > -1) {
        // 直接调用 removeNotification 处理移除和后续动画
        removeNotification(activeNotifications[oldestEntryIndex].element);
    }
  }

  // --- 创建新通知元素 --- 
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  // 初始样式：绝对定位，在容器外右侧，透明，初始 bottom 为 0
  notification.style.position = 'absolute'; 
  notification.style.right = '0';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(110%)';
  notification.style.bottom = '0px'; // Start at the bottom

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
  
  // 构建通知内容 + 进度条
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
    ${mergedOptions.duration && mergedOptions.duration > 0 ? '<div class="notification-progress"></div>' : ''}
  `;
  
  // --- 计算与动画 --- 
  // 1. 测量新通知高度 (临时添加)
  notification.style.visibility = 'hidden'; 
  container.appendChild(notification);
  const notificationHeight = notification.offsetHeight;
  container.removeChild(notification);
  notification.style.visibility = '';
  const pushUpDistance = notificationHeight + NOTIFICATION_GAP;

  // 2. **向上推移现有通知**
  activeNotifications.forEach(entry => {
    const newBottom = entry.currentBottom + pushUpDistance;
    entry.element.style.transition = `bottom ${PUSH_UP_DURATION}ms ease-out`;
    entry.element.style.bottom = `${newBottom}px`;
    entry.currentBottom = newBottom; // Update stored bottom value
  });

  // 3. 添加新通知到容器 (DOM order doesn't strictly matter now)
  container.appendChild(notification);

  // 4. 创建新通知的队列条目
  const newNotificationEntry: ActiveNotification = {
    element: notification,
    timeoutId: null,
    currentBottom: 0, // New notification starts at bottom 0
  };

  // 5. **触发新通知的进入动画 (滑入 + 淡入)**
  void notification.offsetHeight; // Force reflow
  notification.style.transition = `transform ${ENTER_EXIT_DURATION}ms ease-out, opacity ${ENTER_EXIT_DURATION}ms ease-out`;
  notification.style.opacity = '1';
  notification.style.transform = 'translateX(0)';

  // --- 交互与生命周期 --- 
  if (mergedOptions.duration && mergedOptions.duration > 0) {
    const progressBar = notification.querySelector<HTMLElement>('.notification-progress');
    if (progressBar) {
      progressBar.style.animationDuration = `${mergedOptions.duration}ms`;
    }
    newNotificationEntry.timeoutId = window.setTimeout(() => {
      removeNotification(notification);
    }, mergedOptions.duration);
  }

  // 添加到队列
  activeNotifications.push(newNotificationEntry);

  if (mergedOptions.closable) {
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      if (newNotificationEntry.timeoutId !== null) {
        clearTimeout(newNotificationEntry.timeoutId);
      }
      removeNotification(notification);
    });
  }

  // 清理临时添加的 transition
  setTimeout(() => {
      // Clean up push-up transition on existing elements
      activeNotifications.forEach(entry => {
          if (entry.element !== notification && entry.element.style.transition.includes("bottom")) {
             entry.element.style.transition = ''; // Reset to default or remove
          }
      });
       // Clean up enter transition on the new element
      if (document.body.contains(notification)) {
          notification.style.transition = ''; 
      }
  }, Math.max(PUSH_UP_DURATION, ENTER_EXIT_DURATION)); // Wait for the longer animation
}

/**
 * 移除通知并处理后续通知的下落动画
 */
function removeNotification(notificationToRemoveElement: HTMLElement): void {
  const indexToRemove = activeNotifications.findIndex(item => item.element === notificationToRemoveElement);
  if (indexToRemove === -1) return; 

  const removedEntry = activeNotifications[indexToRemove];
  const removedHeight = removedEntry.element.offsetHeight; 
  const dropDownDistance = removedHeight + NOTIFICATION_GAP;

  // 1. 从队列中移除
  activeNotifications.splice(indexToRemove, 1);
  if (removedEntry.timeoutId !== null) {
    clearTimeout(removedEntry.timeoutId);
  }

  // 2. **触发移除动画 (滑出 + 淡出)**
  removedEntry.element.style.transition = `transform ${ENTER_EXIT_DURATION}ms ease-in, opacity ${ENTER_EXIT_DURATION * 0.8}ms ease-in`;
  removedEntry.element.style.transform = 'translateX(110%)';
  removedEntry.element.style.opacity = '0';

  // 3. **处理上方（currentBottom 更高）通知的下落动画**
  activeNotifications.forEach(entry => {
      if (entry.currentBottom > removedEntry.currentBottom) {
          const newBottom = entry.currentBottom - dropDownDistance;
          entry.element.style.transition = `bottom ${DROP_DOWN_DURATION}ms ease-out`;
          entry.element.style.bottom = `${newBottom}px`;
          entry.currentBottom = newBottom;
      }
  });

  // 4. 移除动画结束后从 DOM 移除元素
  setTimeout(() => {
    removedEntry.element.remove();
    // 检查容器是否为空
    const container = document.getElementById('notification-container');
    if (container && container.children.length === 0 && activeNotifications.length === 0) {
      container.remove();
    }
  }, ENTER_EXIT_DURATION);

  // 5. 清理下落动画的 transition
   setTimeout(() => {
      activeNotifications.forEach(entry => {
          // If this element was involved in the dropdown animation
          if (entry.currentBottom > removedEntry.currentBottom - dropDownDistance && // check if it could have dropped
              entry.element.style.transition.includes("bottom")) { 
             entry.element.style.transition = ''; // Reset to default or remove
          }
      });
  }, DROP_DOWN_DURATION); // Wait for drop down to finish
}

// --- Helper Functions --- 

export function showSuccess(message: string, options?: NotificationOptions): void {
  showNotification(message, 'success', options);
}

export function showInfo(message: string, options?: NotificationOptions): void {
  showNotification(message, 'info', options);
}

export function showWarning(message: string, options?: NotificationOptions): void {
  showNotification(message, 'warning', options);
}

export function showError(message: string, options?: NotificationOptions): void {
  showNotification(message, 'error', {
    duration: 8000, // 错误信息持续时间长一点
    ...options
  });
} 