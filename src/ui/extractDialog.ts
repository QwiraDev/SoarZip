// src/ui/extractDialog.ts

// DOM Elements for the dialog
const overlay = document.getElementById('extract-dialog-overlay')!;
const pathInput = document.getElementById('extract-path-input') as HTMLInputElement;
const changePathBtn = document.getElementById('change-path-btn')!;
const confirmBtn = document.getElementById('confirm-extract-btn')!;
const cancelBtn = document.getElementById('cancel-extract-btn')!;

// Type definitions for callbacks
type OnChangePath = () => Promise<string | null>; // Function that triggers folder selection and returns the new path or null
type OnConfirm = (confirmedPath: string) => void; // Function to call when confirm button is clicked
type OnCancel = () => void; // Function to call when cancel button is clicked

let currentPath: string = '';
let onChangePathCallback: OnChangePath | null = null;
let onConfirmCallback: OnConfirm | null = null;
let onCancelCallback: OnCancel | null = null;
let isHiding = false; // Flag to prevent double execution on transitionend

/**
 * 显示解压确认对话框
 * @param defaultPath 默认显示的解压路径
 * @param onChangePath "更改"按钮点击时的回调，应触发路径选择并返回新路径
 * @param onConfirm "确认解压"按钮点击时的回调
 * @param onCancel "取消"按钮点击或关闭对话框时的回调
 */
export function showExtractDialog(
  defaultPath: string,
  onChangePath: OnChangePath,
  onConfirm: OnConfirm,
  onCancel: OnCancel
) {
  currentPath = defaultPath;
  pathInput.value = currentPath;
  pathInput.title = currentPath; // Show full path on hover

  onChangePathCallback = onChangePath;
  onConfirmCallback = onConfirm;
  onCancelCallback = onCancel;

  // Remove previous listeners to prevent duplicates
  changePathBtn.removeEventListener('click', handleChangePathClick);
  confirmBtn.removeEventListener('click', handleConfirmClick);
  cancelBtn.removeEventListener('click', handleCancelClick);
  overlay.removeEventListener('click', handleOverlayClick);
  overlay.removeEventListener('transitionend', handleTransitionEnd); // Remove previous listener

  // Add new listeners
  changePathBtn.addEventListener('click', handleChangePathClick);
  confirmBtn.addEventListener('click', handleConfirmClick);
  cancelBtn.addEventListener('click', handleCancelClick);
  overlay.addEventListener('click', handleOverlayClick);
  overlay.addEventListener('transitionend', handleTransitionEnd); // Add new listener

  // Make overlay visible but keep it transparent initially
  overlay.style.display = 'flex';
  // Trigger reflow before adding class to ensure transition happens
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
  isHiding = false;
}

/**
 * 隐藏解压确认对话框 (触发动画)
 */
function hideDialog() {
  if (isHiding || !overlay.classList.contains('visible')) return; // Prevent running hide logic multiple times or if already hidden
  isHiding = true;
  overlay.classList.remove('visible');
  // Actual hiding (display: none) will happen in handleTransitionEnd
}

// Handler for transition end to set display: none after fade out
function handleTransitionEnd(event: TransitionEvent) {
    // Ensure the transitionend event is for the overlay opacity
    if (event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
        overlay.style.display = 'none';
        isHiding = false; // Reset flag after hiding is complete

        // Clean up callbacks after visually hidden
        onChangePathCallback = null;
        onConfirmCallback = null;
        onCancelCallback = null;
    }
}

// Event Handlers
async function handleChangePathClick() {
  if (onChangePathCallback) {
    try {
      // Temporarily hide dialog to show folder picker clearly (optional)
      // overlay.style.opacity = '0'; 
      const newPath = await onChangePathCallback();
      // Restore dialog opacity if hidden
      // overlay.style.opacity = '1'; 

      if (newPath) {
        currentPath = newPath;
        pathInput.value = currentPath;
        pathInput.title = currentPath; // Update tooltip
      }
    } catch (error) {
      console.error("选择新路径时出错:", error);
      // Restore dialog opacity in case of error
      // overlay.style.opacity = '1';
    }
  }
}

function handleConfirmClick() {
  if (onConfirmCallback) {
    onConfirmCallback(currentPath); // Pass the final path
  }
  hideDialog(); // Trigger fade out
}

function handleCancelClick() {
  if (onCancelCallback) {
    onCancelCallback();
  }
  hideDialog(); // Trigger fade out
}

// Handle clicks outside the dialog box to close/cancel
function handleOverlayClick(event: MouseEvent) {
    // Check if the click was on the overlay itself, not the dialog content
    if (event.target === overlay) {
        handleCancelClick(); // Uses hideDialog internally now
    }
} 