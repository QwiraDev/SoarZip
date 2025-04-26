/**
 * Notification Module - Manages display and lifecycle of notifications
 * using absolute positioning and manual animations.
 * 通知模块 - 使用绝对定位和手动动画管理通知的显示和生命周期。
 */

/**
 * Type definition for the notification categories.
 * 通知类别的类型定义。
 */
type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Interface for notification options.
 * 通知选项的接口。
 * 
 * @property duration - Optional duration in milliseconds before auto-closing.
 *                    - 自动关闭前的可选持续时间（毫秒）。
 * @property closable - Optional flag to make the notification closable by the user.
 *                    - 使通知可由用户关闭的可选标志。
 */
interface NotificationOptions {
  duration?: number; 
  closable?: boolean; 
}

/**
 * Interface for tracking active notifications.
 * 用于跟踪活动通知的接口。
 * 
 * @property element - The HTMLElement of the notification.
 *                   - 通知的HTMLElement。
 * @property timeoutId - ID of the auto-close timeout, or null.
 *                     - 自动关闭超时的ID，或为null。
 * @property currentBottom - The current calculated 'bottom' CSS value in pixels.
 *                         - 当前计算的 'bottom' CSS值（像素）。
 */
interface ActiveNotification {
  element: HTMLElement;
  timeoutId: number | null;
  currentBottom: number; 
}

// Default options for notifications
const defaultOptions: NotificationOptions = {
  duration: 5000, // Default duration 5 seconds
  closable: true,   // Default is closable
};

// Constants for notification behavior and appearance
const MAX_NOTIFICATIONS = 5; // Maximum number of notifications displayed at once
const PUSH_UP_DURATION = 300; // Animation duration for pushing up existing notifications (ms)
const DROP_DOWN_DURATION = 300; // Animation duration for dropping down notifications (ms)
const ENTER_EXIT_DURATION = 300; // Animation duration for slide in/out (ms)
const NOTIFICATION_GAP = 10; // Vertical gap between notifications (px)

/**
 * Array storing currently active notifications.
 * 存储当前活动通知的数组。
 */
const activeNotifications: ActiveNotification[] = [];

/**
 * Gets or creates the notification container element.
 * 获取或创建通知容器元素。
 * 
 * @returns The notification container HTMLElement.
 *          通知容器HTMLElement。
 */
function getNotificationContainer(): HTMLElement {
  let container = document.getElementById('notification-container');
  if (!container) {
    // If container doesn't exist, create and append it to the body
    container = document.createElement('div');
    container.id = 'notification-container';
    // Styles are applied via notification.css
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Creates and displays a notification.
 * Manages the notification queue, positioning, animations, and lifecycle.
 * 
 * 创建并显示通知。
 * 管理通知队列、定位、动画和生命周期。
 * 
 * @param message - The message content of the notification.
 *                - 通知的消息内容。
 * @param type - The type of notification ('info', 'success', 'warning', 'error').
 *             - 通知的类型（'info', 'success', 'warning', 'error'）。
 * @param options - Optional configuration for the notification.
 *                - 通知的可选配置。
 */
export function showNotification(
  message: string,
  type: NotificationType = 'info',
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...defaultOptions, ...options }; // Merge user options with defaults
  const container = getNotificationContainer();

  // --- Limit Check & Old Notification Removal --- 
  if (activeNotifications.length >= MAX_NOTIFICATIONS) {
    // If the maximum number is reached, remove the oldest (visually top-most) notification
    let highestBottom = -1;
    let oldestEntryIndex = -1;
    // Find the notification with the highest 'currentBottom' value
    for(let i = 0; i < activeNotifications.length; i++) {
      if (activeNotifications[i].currentBottom > highestBottom) {
        highestBottom = activeNotifications[i].currentBottom;
        oldestEntryIndex = i;
      }
    }
    if (oldestEntryIndex > -1) {
        // Call removeNotification to handle removal and subsequent animations
        removeNotification(activeNotifications[oldestEntryIndex].element);
    }
  }

  // --- Create New Notification Element --- 
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`; // Base and type-specific classes
  // Initial styles for entry animation (off-screen right, transparent, bottom 0)
  notification.style.position = 'absolute'; 
  notification.style.right = '0';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(110%)';
  notification.style.bottom = '0px'; // Start at the bottom of the container

  // --- Select Icon based on Type --- 
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
  
  // --- Build Notification Inner HTML --- 
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">${message}</div>
    ${mergedOptions.closable ? `
      <button class="notification-close" title="Close notification">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    ` : ''} 
    ${mergedOptions.duration && mergedOptions.duration > 0 ? '<div class="notification-progress"></div>' : ''} 
  `;
  
  // --- Positioning and Animation --- 
  // 1. Measure the height of the new notification (needed for push-up calculation)
  // Temporarily add to DOM, measure, then remove
  notification.style.visibility = 'hidden'; 
  container.appendChild(notification);
  const notificationHeight = notification.offsetHeight;
  container.removeChild(notification);
  notification.style.visibility = ''; // Make visible again before animation
  const pushUpDistance = notificationHeight + NOTIFICATION_GAP; // Total distance to push existing ones

  // 2. Animate existing notifications upwards
  activeNotifications.forEach(entry => {
    const newBottom = entry.currentBottom + pushUpDistance;
    // Apply transition specifically for the 'bottom' property
    entry.element.style.transition = `bottom ${PUSH_UP_DURATION}ms ease-out`;
    entry.element.style.bottom = `${newBottom}px`; // Set new bottom position
    entry.currentBottom = newBottom; // Update the stored bottom value
  });

  // 3. Add the new notification element to the container
  // (DOM order doesn't strictly matter for positioning with absolute)
  container.appendChild(notification);

  // 4. Create the entry for the new notification in the active list
  const newNotificationEntry: ActiveNotification = {
    element: notification,
    timeoutId: null, // Will be set later if duration is used
    currentBottom: 0, // New notification starts at the calculated bottom 0
  };

  // 5. Trigger the entry animation for the new notification (slide in + fade in)
  void notification.offsetHeight; // Force reflow to ensure transition applies
  // Apply transitions for transform and opacity
  notification.style.transition = `transform ${ENTER_EXIT_DURATION}ms ease-out, opacity ${ENTER_EXIT_DURATION}ms ease-out`;
  notification.style.opacity = '1'; // Fade in
  notification.style.transform = 'translateX(0)'; // Slide in from right

  // --- Interaction and Lifecycle --- 
  if (mergedOptions.duration && mergedOptions.duration > 0) {
    // If duration is set, start the progress bar animation and set auto-close timeout
    const progressBar = notification.querySelector<HTMLElement>('.notification-progress');
    if (progressBar) {
      progressBar.style.animationDuration = `${mergedOptions.duration}ms`; // Sync with duration
    }
    newNotificationEntry.timeoutId = window.setTimeout(() => {
      // Use removeNotification to handle fade-out and cleanup
      removeNotification(notification);
    }, mergedOptions.duration);
  }

  // Add the new notification entry to the beginning of the array (or end, order doesn't strictly matter for logic here)
  activeNotifications.push(newNotificationEntry);

  // Add close button listener if closable
  if (mergedOptions.closable) {
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      // If closed manually, clear the auto-close timeout
      if (newNotificationEntry.timeoutId !== null) {
        clearTimeout(newNotificationEntry.timeoutId);
      }
      // Use removeNotification for consistent removal animation
      removeNotification(notification);
    });
  }

  // Clean up temporary transition styles after animations complete
  setTimeout(() => {
      // Clean up push-up transition on existing elements
      activeNotifications.forEach(entry => {
          // Check if the element still exists and had a bottom transition applied
          if (entry.element !== notification && entry.element.style.transition.includes("bottom")) {
             entry.element.style.transition = ''; // Reset to default CSS transitions or remove
          }
      });
       // Clean up enter transition on the new element if it still exists
      if (document.body.contains(notification)) {
          notification.style.transition = ''; 
      }
  }, Math.max(PUSH_UP_DURATION, ENTER_EXIT_DURATION)); // Wait for the longest relevant animation
}

/**
 * Removes a specific notification element.
 * Handles the fade-out/slide-out animation and triggers the drop-down animation for subsequent notifications.
 * 
 * 从DOM中移除指定的通知元素。
 * 处理淡出/滑出动画，并触发后续通知的下落动画。
 * 
 * @param notificationToRemoveElement - The HTMLElement of the notification to remove.
 *                                    - 要移除的通知的HTMLElement。
 */
function removeNotification(notificationToRemoveElement: HTMLElement): void {
  // Find the notification entry in the active list
  const indexToRemove = activeNotifications.findIndex(item => item.element === notificationToRemoveElement);
  if (indexToRemove === -1) return; // Exit if not found (already removed)

  const removedEntry = activeNotifications[indexToRemove];
  const removedHeight = removedEntry.element.offsetHeight; // Get height before removal
  const dropDownDistance = removedHeight + NOTIFICATION_GAP; // Calculate distance for others to drop

  // 1. Remove from the active notifications array
  activeNotifications.splice(indexToRemove, 1);
  // Clear auto-close timeout if it exists
  if (removedEntry.timeoutId !== null) {
    clearTimeout(removedEntry.timeoutId);
  }

  // 2. Trigger the exit animation (slide out + fade out)
  removedEntry.element.style.transition = `transform ${ENTER_EXIT_DURATION}ms ease-in, opacity ${ENTER_EXIT_DURATION * 0.8}ms ease-in`;
  removedEntry.element.style.transform = 'translateX(110%)'; // Slide out to the right
  removedEntry.element.style.opacity = '0'; // Fade out

  // 3. Animate the drop-down for notifications that were above the removed one
  activeNotifications.forEach(entry => {
      // Check if this notification was positioned above the one being removed
      if (entry.currentBottom > removedEntry.currentBottom) {
          const newBottom = entry.currentBottom - dropDownDistance; // Calculate new bottom position
          // Apply transition specifically for the 'bottom' property
          entry.element.style.transition = `bottom ${DROP_DOWN_DURATION}ms ease-out`;
          entry.element.style.bottom = `${newBottom}px`; // Set new bottom position
          entry.currentBottom = newBottom; // Update the stored bottom value
      }
  });

  // 4. Remove the element from the DOM after the exit animation completes
  setTimeout(() => {
    if (removedEntry.element.parentNode) {
        removedEntry.element.remove();
    }
    // Check if the container is now empty and remove it if so
    const container = document.getElementById('notification-container');
    if (container && container.children.length === 0 && activeNotifications.length === 0) {
      container.remove(); // Clean up empty container
    }
  }, ENTER_EXIT_DURATION);

  // 5. Clean up temporary drop-down transition styles after the animation completes
   setTimeout(() => {
      activeNotifications.forEach(entry => {
          // Check if this element was involved in the drop-down animation
          // A simple check is if its transition style includes 'bottom'
          if (entry.element.style.transition.includes("bottom")) { 
             entry.element.style.transition = ''; // Reset to default CSS transitions or remove
          }
      });
  }, DROP_DOWN_DURATION); // Wait for drop down animation duration
}

// --- Helper Functions for specific types --- 

/**
 * Shows a success notification.
 * 显示成功通知。
 * 
 * @param message - The message content.
 *                - 消息内容。
 * @param options - Optional notification configuration.
 *                - 可选的通知配置。
 */
export function showSuccess(message: string, options?: NotificationOptions): void {
  showNotification(message, 'success', options);
}

/**
 * Shows an informational notification.
 * 显示信息通知。
 * 
 * @param message - The message content.
 *                - 消息内容。
 * @param options - Optional notification configuration.
 *                - 可选的通知配置。
 */
export function showInfo(message: string, options?: NotificationOptions): void {
  showNotification(message, 'info', options);
}

/**
 * Shows a warning notification.
 * 显示警告通知。
 * 
 * @param message - The message content.
 *                - 消息内容。
 * @param options - Optional notification configuration.
 *                - 可选的通知配置。
 */
export function showWarning(message: string, options?: NotificationOptions): void {
  showNotification(message, 'warning', options);
}

/**
 * Shows an error notification.
 * Errors typically have a longer default duration.
 * 
 * 显示错误通知。
 * 错误通常具有较长的默认持续时间。
 * 
 * @param message - The message content.
 *                - 消息内容。
 * @param options - Optional notification configuration.
 *                - 可选的通知配置。
 */
export function showError(message: string, options?: NotificationOptions): void {
  showNotification(message, 'error', {
    duration: 8000, // Longer default duration for errors (8 seconds)
    ...options // Allow overriding duration
  });
} 