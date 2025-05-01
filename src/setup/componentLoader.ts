// Import HTML content directly using Vite's ?raw suffix
import titlebarHtml from '../ui/components/titlebar.html?raw';
import toolbarHtml from '../ui/components/toolbar.html?raw';
import fileExplorerHtml from '../ui/components/file-explorer.html?raw';
import statusBarHtml from '../ui/components/status-bar.html?raw';
import extractDialogHtml from '../ui/components/extract-dialog.html?raw';
import confirmDialogHtml from '../ui/components/confirm-dialog.html?raw';
import { showError } from '../ui/notification';

/**
 * Inserts HTML content into a placeholder element.
 * 将HTML内容插入到占位符元素中。
 *
 * @param htmlContent - The HTML string content to insert.
 *                    - 要插入的HTML字符串内容。
 * @param placeholderId - The ID of the HTML element where the content should be inserted.
 *                      - 应插入内容的HTML元素的ID。
 * @param componentName - A descriptive name for the component (for logging).
 *                      - 组件的描述性名称（用于日志记录）。
 */
function loadComponent(htmlContent: string, placeholderId: string, componentName: string) {
  try {
    const placeholder = document.getElementById(placeholderId);
    if (placeholder) {
      placeholder.innerHTML = htmlContent;
      console.log(`Successfully inserted component '${componentName}' into #${placeholderId}`);
    } else {
      console.error(`Placeholder element with ID '${placeholderId}' not found for component '${componentName}'.`);
      // Optionally show an error to the user if a critical component fails
      // showError(`无法加载界面组件: ${componentName}`);
    }
  } catch (error) {
    console.error(`Failed to insert component '${componentName}':`, error);
    // Optionally show an error to the user if a critical component fails
    showError(`无法加载界面组件: ${componentName}`); // Let's enable this
  }
}

/**
 * Loads all necessary UI components by inserting their pre-imported HTML content.
 * 通过插入预先导入的HTML内容来加载所有必需的UI组件。
 */
export function loadAllComponents() {
  console.log("Inserting UI components...");
  loadComponent(titlebarHtml, 'titlebar-placeholder', 'titlebar.html');
  loadComponent(toolbarHtml, 'toolbar-placeholder', 'toolbar.html');
  loadComponent(fileExplorerHtml, 'file-explorer-placeholder', 'file-explorer.html');
  loadComponent(statusBarHtml, 'status-bar-placeholder', 'status-bar.html');
  loadComponent(extractDialogHtml, 'dialog-placeholder', 'extract-dialog.html');

  // Append the confirm dialog HTML to the body
  const confirmDialogContainer = document.createElement('div');
  confirmDialogContainer.innerHTML = confirmDialogHtml;
  // Append each top-level element from the confirm dialog HTML to the body
  // This prevents adding an extra wrapper div if confirmDialogHtml has a single root
  while (confirmDialogContainer.firstChild) {
    document.body.appendChild(confirmDialogContainer.firstChild);
  }

  console.log("All UI components inserted.");
} 