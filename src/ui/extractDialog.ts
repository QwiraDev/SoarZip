// src/ui/extractDialog.ts

// DOM Element References (initialize later)
let overlay: HTMLElement | null = null;
let pathInput: HTMLInputElement | null = null;
let changePathBtn: HTMLElement | null = null;
let confirmBtn: HTMLElement | null = null;
let cancelBtn: HTMLElement | null = null;

// Function to initialize DOM elements
function initializeDialogElements() {
  overlay = document.getElementById('extract-dialog-overlay')!;
  pathInput = document.getElementById('extract-path-input') as HTMLInputElement;
  changePathBtn = document.getElementById('change-path-btn')!;
  confirmBtn = document.getElementById('confirm-extract-btn')!;
  cancelBtn = document.getElementById('cancel-extract-btn')!;
}

// Type definitions for callbacks
/**
 * Type definition for the 'Change Path' callback.
 * Should trigger a folder selection dialog and return the selected path or null/undefined if cancelled.
 * "更改路径"回调的类型定义。
 * 应触发文件夹选择对话框，并在取消时返回所选路径或 null/undefined。
 */
type OnChangePath = () => Promise<string | null | undefined>; 
/**
 * Type definition for the 'Confirm' callback.
 * Called with the final confirmed extraction path.
 * "确认"回调的类型定义。
 * 使用最终确认的解压路径调用。
 */
type OnConfirm = (confirmedPath: string) => void; 
/**
 * Type definition for the 'Cancel' callback.
 * Called when the dialog is cancelled or closed.
 * "取消"回调的类型定义。
 * 在对话框被取消或关闭时调用。
 */
type OnCancel = () => void; 

/**
 * Stores the current extraction path displayed in the dialog.
 * 存储对话框中显示的当前解压路径。
 */
let currentPath: string = '';
/**
 * Stores the reference to the provided OnChangePath callback.
 * 存储提供的 OnChangePath 回调的引用。
 */
let onChangePathCallback: OnChangePath | null = null;
/**
 * Stores the reference to the provided OnConfirm callback.
 * 存储提供的 OnConfirm 回调的引用。
 */
let onConfirmCallback: OnConfirm | null = null;
/**
 * Stores the reference to the provided OnCancel callback.
 * 存储提供的 OnCancel 回调的引用。
 */
let onCancelCallback: OnCancel | null = null;
/**
 * Flag to prevent multiple hide actions during the transition.
 * 防止在过渡期间执行多次隐藏操作的标志。
 */
let isHiding = false; 

/**
 * Shows the extraction confirmation dialog.
 * 显示解压确认对话框。
 * 
 * @param defaultPath - The default path to display initially.
 *                    - 初始显示的默认路径。
 * @param onChangePath - Callback function for the 'Change Path' button.
 *                     - "更改路径"按钮的回调函数。
 * @param onConfirm - Callback function for the 'Confirm' button.
 *                  - "确认"按钮的回调函数。
 * @param onCancel - Callback function for the 'Cancel' button or closing the dialog.
 *                 - "取消"按钮或关闭对话框的回调函数。
 */
export function showExtractDialog(
  defaultPath: string,
  onChangePath: OnChangePath,
  onConfirm: OnConfirm,
  onCancel: OnCancel
) {
  // Ensure elements are initialized
  if (!overlay) {
    initializeDialogElements();
  }

  // Check if elements were found (add null checks)
  if (!overlay || !pathInput || !changePathBtn || !confirmBtn || !cancelBtn) {
    console.error("Extract dialog elements not found!");
    return; // Exit if elements are missing
  }

  currentPath = defaultPath; // Set initial path
  pathInput.value = currentPath; // Display path in the input-like element
  pathInput.title = currentPath; // Set tooltip to show full path on hover

  // Store the provided callback functions
  onChangePathCallback = onChangePath;
  onConfirmCallback = onConfirm;
  onCancelCallback = onCancel;

  // Remove previous event listeners to prevent duplicates if shown multiple times
  changePathBtn.removeEventListener('click', handleChangePathClick);
  confirmBtn.removeEventListener('click', handleConfirmClick);
  cancelBtn.removeEventListener('click', handleCancelClick);
  overlay.removeEventListener('click', handleOverlayClick);
  overlay.removeEventListener('transitionend', handleTransitionEnd); // Clean up previous end listener

  // Add new event listeners for dialog interactions
  changePathBtn.addEventListener('click', handleChangePathClick);
  confirmBtn.addEventListener('click', handleConfirmClick);
  cancelBtn.addEventListener('click', handleCancelClick);
  overlay.addEventListener('click', handleOverlayClick); // Listener for clicks outside the dialog
  overlay.addEventListener('transitionend', handleTransitionEnd); // Listener for fade-out completion

  // Make the overlay element visible (it starts with opacity 0)
  overlay.style.display = 'flex';
  // Use requestAnimationFrame to ensure the 'display' change is rendered before adding the 'visible' class, triggering the CSS transition.
  requestAnimationFrame(() => {
    overlay!.classList.add('visible'); // Add class to start fade-in transition
  });
  isHiding = false; // Reset hiding flag when showing
}

/**
 * Hides the extraction confirmation dialog by triggering the fade-out animation.
 * 通过触发展开动画隐藏解压确认对话框。
 */
function hideDialog() {
  // Prevent hiding if already hiding or not visible
  // Assert overlay is not null here since we just checked
  if (isHiding || !overlay!.classList.contains('visible')) return; 
  isHiding = true; // Set flag to prevent re-entry
  overlay!.classList.remove('visible'); // Remove class to start fade-out transition
  // The actual hiding (setting display: none) is handled by the handleTransitionEnd function.
}

/**
 * Event handler for the 'transitionend' event on the overlay.
 * Sets the display property to 'none' after the fade-out animation completes.
 * Also cleans up stored callback references.
 * 
 * 遮罩层上 'transitionend' 事件的事件处理程序。
 * 在淡出动画完成后将 display 属性设置为 'none'。
 * 同时清理存储的回调引用。
 * 
 * @param event - The TransitionEvent object.
 *              - TransitionEvent 对象。
 */
function handleTransitionEnd(event: TransitionEvent) {
    // Ensure the transition that ended was the opacity transition on the overlay itself
    if (overlay && event.target === overlay && event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
        overlay.style.display = 'none'; // Hide the element completely
        isHiding = false; // Reset the hiding flag

        // Clean up callback references after the dialog is visually hidden
        onChangePathCallback = null;
        onConfirmCallback = null;
        onCancelCallback = null;
    }
}

/**
 * Event handler for the 'Change Path' button click.
 * Calls the onChangePathCallback to trigger the folder selection UI.
 * Updates the displayed path if a new path is selected.
 * 
 * "更改路径"按钮点击的事件处理程序。
 * 调用 onChangePathCallback 以触文件夹选择UI。
 * 如果选择了新路径，则更新显示的路径。
 */
async function handleChangePathClick() {
  if (onChangePathCallback) {
    try {
      // Optional: Temporarily hide or fade the dialog to make the native folder picker more prominent.
      // overlay.style.opacity = '0'; 
      
      const newPath = await onChangePathCallback(); // Await the path selection result
      
      // Optional: Restore dialog visibility if it was temporarily hidden.
      // overlay.style.opacity = '1'; 

      if (newPath) {
        // If a new path was selected, update the state and UI
        currentPath = newPath;
        pathInput!.value = currentPath;
        pathInput!.title = currentPath; // Update tooltip for the input-like element
      }
    } catch (error) {
      console.error("Error during path selection:", error);
      // Optional: Ensure dialog is visible again in case of error during temporary hiding.
      // if (overlay) overlay.style.opacity = '1';
    }
  }
}

/**
 * Event handler for the 'Confirm' button click.
 * Calls the onConfirmCallback with the currently selected path and hides the dialog.
 * 
 * "确认"按钮点击的事件处理程序。
 * 使用当前选择的路径调用 onConfirmCallback 并隐藏对话框。
 */
function handleConfirmClick() {
  if (onConfirmCallback) {
    onConfirmCallback(currentPath); // Pass the final selected path to the callback
  }
  hideDialog(); // Hide the dialog after confirmation
}

/**
 * Event handler for the 'Cancel' button click.
 * Calls the onCancelCallback and hides the dialog.
 * 
 * "取消"按钮点击的事件处理程序。
 * 调用 onCancelCallback 并隐藏对话框。
 */
function handleCancelClick() {
  if (onCancelCallback) {
    onCancelCallback(); // Execute the cancellation callback
  }
  hideDialog(); // Hide the dialog on cancellation
}

/**
 * Event handler for clicks on the dialog overlay (outside the main dialog content).
 * Closes the dialog, treating it as a cancellation.
 * 
 * 对话框遮罩层（主对话框内容之外）上的点击事件处理程序。
 * 关闭对话框，将其视为取消操作。
 * 
 * @param event - The MouseEvent object.
 *              - MouseEvent 对象。
 */
function handleOverlayClick(event: MouseEvent) {
    // Check if the click target was the overlay element itself, not a child element (like the dialog box)
    if (event.target === overlay) {
        handleCancelClick(); // Treat clicking outside as cancel
    }
} 