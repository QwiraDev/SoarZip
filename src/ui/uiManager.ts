import { formatFileSize } from "../utils/index";
import {
  FileItem,
  filterFilesByFolder,
  sortFiles,
  getFileStats
} from "../services/fileService";
import {
  getFileNameFromPath
} from "../services/windowService";
import {
  navigationHistory,
  normalizeFolderPath,
  updateNavButtonsState,
} from "../services/navigationService";
import {
  updateFileList,
  updatePathNavigation,
  setLoading as setFileListLoading,
  showHomePage
} from "./fileExplorer";
import { showInfo, showError } from "./notification";
import {
  getCurrentArchivePath, 
  getCurrentFiles, 
  getIsLoading, 
  setIsLoading as setAppStateLoading,
  resetAppState
} from "../services/appState";
import { setWindowTitle } from "../services/windowService"; // For logo click reset
import { updateToolbarButtonsState } from "../setup/toolbar"; // For logo click reset & status bar updates

// Re-export showHomePage for main.ts
export { showHomePage } from "./fileExplorer";

/**
 * Refreshes the entire UI based on the current application state (archive, path, files).
 * 根据当前应用程序状态（压缩包、路径、文件）刷新整个UI。
 */
export function refreshUI() {
  const currentFolder = navigationHistory.getCurrentPath();
  const currentFiles = getCurrentFiles();
  const currentArchivePath = getCurrentArchivePath();
  console.log(`[uiManager] Refreshing UI, current folder: "${currentFolder}"`);

  const filteredFiles = filterFilesByFolder(currentFiles, currentFolder);
  const sortedFiles = sortFiles(filteredFiles);

  updateFileList(
    sortedFiles,
    currentFolder,
    undefined, // onFileClick
    (file: FileItem) => { // onFileDblClick
      if (getIsLoading()) return;
      if (file.is_dir) {
        navigateToFolder(file.name); // Use the manager's navigation function
      } else {
        console.log(`Attempted to preview file (not implemented): ${file.name}`);
        // Potentially call a file preview service here
      }
    }
  );

  updatePathNavigation(
    currentFolder,
    getFileNameFromPath(currentArchivePath),
    navigateToFolder // Use the manager's navigation function
  );

  updateNavButtonsState();
  updateStatusBar();
}

/**
 * Navigates to a specific folder within the archive and updates the UI.
 * 导航到压缩包中的特定文件夹并更新UI。
 *
 * @param folderPath - The relative path within the archive to navigate to.
 *                   - 要导航到的压缩包内相对路径。
 */
export function navigateToFolder(folderPath: string) {
  console.log(`[uiManager] Navigating to folder: ${folderPath}`);
  if (getIsLoading()) return;

  const normalizedPath = normalizeFolderPath(folderPath);
  navigationHistory.addPath(normalizedPath);
  refreshUI();
}

/**
 * Updates the application loading state and the UI indicator (spinner, status text).
 * 更新应用程序加载状态和UI指示器（旋转图标、状态文本）。
 *
 * @param loading - Whether the application is entering the loading state.
 *                - 应用程序是否进入加载状态。
 * @param message - Optional message to display while loading.
 *                - 加载时显示的可选消息。
 */
export function updateLoadingStatus(loading: boolean, message: string = "") {
  setAppStateLoading(loading);
  setFileListLoading(loading); // Update file list UI loading state

  const statusTextElement = document.getElementById('status-text');
  const spinnerElement = document.getElementById('status-spinner');

  if (statusTextElement) {
    if (loading) {
      statusTextElement.textContent = message;
      document.body.classList.add('loading');
      if (spinnerElement) {
        spinnerElement.style.display = 'inline-block';
      }
    } else {
      document.body.classList.remove('loading');
      updateStatusBar(); // Restore default status bar text
      if (spinnerElement) {
        spinnerElement.style.display = 'none';
      }
    } 
  }
}

/**
 * Updates the status bar with current folder/archive information or a welcome message.
 * 使用当前文件夹/压缩包信息或欢迎消息更新状态栏。
 */
export function updateStatusBar() {
  // Prevent status bar update if loading
  if (getIsLoading()) return; 

  const statusTextElement = document.getElementById('status-text');
  const statusRight = document.querySelector('.status-right');

  if (!statusTextElement || !statusRight) return;

  const currentArchivePath = getCurrentArchivePath();
  if (!currentArchivePath) {
    statusTextElement.textContent = '欢迎使用 Soar Zip';
    statusRight.textContent = '版本: 0.1.0'; // TODO: Get version dynamically
    return;
  }

  const currentFolder = navigationHistory.getCurrentPath();
  const currentFiles = getCurrentFiles();
  const stats = getFileStats(currentFiles, currentFolder);

  statusTextElement.textContent = `${stats.count}个项目`;
  statusRight.textContent = `总大小: ${formatFileSize(stats.totalSize)}`;
}

/**
 * Performs a search within the currently displayed folder and updates the file list.
 * 在当前显示的文件夹内执行搜索并更新文件列表。
 *
 * @param query - The search query string.
 *              - 搜索查询字符串。
 */
export function performSearch(query: string) {
  console.log(`[uiManager] Performing search for: "${query}"`);
  const currentArchivePath = getCurrentArchivePath();
  if (!currentArchivePath) {
    showError('请先打开一个压缩包');
    return;
  }

  if (getIsLoading()) return; // Don't search while loading

  const currentFolder = navigationHistory.getCurrentPath();
  const currentFiles = getCurrentFiles();
  const filesToSearch = filterFilesByFolder(currentFiles, currentFolder);

  const searchResults = filesToSearch.filter(file => {
    const displayName = getFileNameFromPath(file.name) || file.name;
    return displayName.toLowerCase().includes(query.toLowerCase());
  });

  console.log(`Search found ${searchResults.length} results.`);

  // Update file list directly with search results
  updateFileList(sortFiles(searchResults), currentFolder);

  // Update status bar to show search result count
  const statusTextElement = document.getElementById('status-text'); // Target correct element
  if (statusTextElement) {
    statusTextElement.textContent = `找到 ${searchResults.length} 个匹配项`;
  }

  if (searchResults.length === 0) {
    showInfo(`未找到匹配 "${query}" 的文件`);
  }
}

/**
 * Resets the application to its initial state (home screen).
 * 将应用程序重置到其初始状态（主屏幕）。
 */
export function resetAppToHome() {
  resetAppState();
  showHomePage();
  setWindowTitle('未打开文件');
  updateStatusBar();
  updateToolbarButtonsState(false); // Disable buttons relevant to open archive
  navigationHistory.reset("");
} 