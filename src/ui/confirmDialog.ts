// DOM Element References
let overlay: HTMLElement | null = null;
let messageElement: HTMLElement | null = null;
let confirmBtn: HTMLElement | null = null;
let cancelBtn: HTMLElement | null = null;

// Callbacks
let onConfirmCallback: (() => void) | null = null;
let onCancelCallback: (() => void) | null = null;

// State
let isInitialized = false;
let isVisible = false;
let isHiding = false;

function initializeDialog() {
    if (isInitialized) return;

    overlay = document.getElementById('confirm-dialog-overlay');
    messageElement = document.getElementById('confirm-dialog-message');
    confirmBtn = document.getElementById('confirm-dialog-confirm-btn');
    cancelBtn = document.getElementById('confirm-dialog-cancel-btn');

    if (!overlay || !messageElement || !confirmBtn || !cancelBtn) {
        console.error('Confirm dialog elements not found in DOM!');
        // If elements are missing, we can't proceed. isInitialized remains false.
        return;
    }

    // Add event listeners only once
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
    overlay.addEventListener('transitionend', handleTransitionEnd);

    isInitialized = true;
    console.log("Confirm dialog initialized."); // Added log for confirmation
}

function showDialog(message: string, onConfirm: () => void, onCancel?: () => void) {
    // Ensure initialized before showing
    if (!isInitialized) {
        console.error("Attempted to show confirm dialog before it was initialized or failed initialization.");
        return;
    }
    // Also check elements directly in case initialization failed silently
    if (!overlay || !messageElement || isVisible || isHiding) {
        console.warn("Confirm dialog cannot be shown. Overlay or message element missing, or already visible/hiding.");
        return;
    }

    messageElement.textContent = message;
    onConfirmCallback = onConfirm;
    onCancelCallback = onCancel || null; // Store optional cancel callback

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay!.classList.add('visible');
        isVisible = true;
    });
}

function hideDialog() {
    if (!isVisible || isHiding || !overlay) return;

    isHiding = true;
    overlay.classList.remove('visible');
    // Actual hiding (display: none) is handled in handleTransitionEnd
}

function handleConfirm() {
    if (onConfirmCallback) {
        onConfirmCallback();
    }
    hideDialog();
}

function handleCancel() {
    if (onCancelCallback) {
        onCancelCallback();
    }
    hideDialog();
}

function handleOverlayClick(event: MouseEvent) {
    // Close only if clicking directly on the overlay, not the dialog content
    if (event.target === overlay) {
        handleCancel();
    }
}

function handleTransitionEnd(event: TransitionEvent) {
    // Only act on the opacity transition of the overlay itself when fading out
    if (overlay && event.target === overlay && event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
        overlay.style.display = 'none';
        isHiding = false;
        isVisible = false;
        // Clean up callbacks after visually hidden
        onConfirmCallback = null;
        onCancelCallback = null;
    }
}

/**
 * Shows a confirmation dialog.
 * 显示一个确认对话框。
 *
 * @param message - The message to display in the dialog.
 *                - 要在对话框中显示的消息。
 * @param onConfirm - Callback function executed when the user confirms.
 *                  - 用户确认时执行的回调函数。
 * @param onCancel - Optional callback function executed when the user cancels or closes the dialog.
 *                 - 用户取消或关闭对话框时执行的可选回调函数。
 */
export function showConfirmDialog(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
): void { // Return type is void
    initializeDialog(); // Call initialize (it handles the isInitialized check)
    if (isInitialized) {
        showDialog(message, onConfirm, onCancel);
    }
} 