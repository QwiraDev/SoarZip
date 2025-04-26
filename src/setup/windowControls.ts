/**
 * Window Controls Setup Module - Configures the window control buttons
 * 窗口控制设置模块 - 配置窗口控制按钮
 */
import { minimizeWindow, maximizeWindow, closeWindow } from '../services/windowService';

/**
 * Sets up event handlers for window control buttons (minimize, maximize, close)
 * 为窗口控制按钮（最小化、最大化、关闭）设置事件处理程序
 */
export function setupWindowControls(): void {
  console.log("Setting up window controls..."); // Log setup start
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  if (!minimizeBtn || !maximizeBtn || !closeBtn) {
    console.error("Window control buttons not found!");
    return;
  }

  minimizeBtn.addEventListener('click', () => {
    console.log("Minimize button clicked"); // Log click
    minimizeWindow();
  });
  maximizeBtn.addEventListener('click', () => {
    console.log("Maximize button clicked"); // Log click
    maximizeWindow();
  });
  closeBtn.addEventListener('click', () => {
    console.log("Close button clicked"); // Log click
    closeWindow();
  });
  console.log("Window controls setup complete."); // Log setup end
} 