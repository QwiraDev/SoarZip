import { formatFileSize } from "./utils/index";
import { 
  FileItem, 
  openArchive, 
  selectArchiveFile, 
  filterFilesByFolder, 
  sortFiles, 
  getFileStats,
  selectDestinationFolder,
  extractFiles
} from "./services/fileService";
import { 
  setWindowTitle, 
  getFileNameFromPath,
  getDefaultExtractPath
} from "./services/windowService";
import { 
  navigationHistory, 
  normalizeFolderPath, 
  updateNavButtonsState 
} from "./services/navigationService";
import { 
  showFileBrowser, 
  showHomePage, 
  updateFileList, 
  updatePathNavigation, 
  setLoading,
  getSelectedFiles
} from "./ui/fileExplorer";
import { showExtractDialog } from "./ui/extractDialog";
import { 
  showError, 
  showInfo, 
  showSuccess 
} from "./ui/notification";
import { initializeTheme } from "./services/themeService";

// Import setup modules for UI component initialization
import { setupWindowControls } from './setup/windowControls';
import { setupMenuItems } from './setup/menu';
import { setupHomeActions } from './setup/home';
import { setupNavButtons } from './setup/navigation';
import { 
  setupToolbarButtons, 
  updateToolbarButtonsState
} from './setup/toolbar';
import { setupSearch } from './setup/search';
import { setupLogoClick } from './setup/logo';
import { setupSettingsButton } from './setup/settings';

// Import main stylesheet
import "./styles/main.css";

// Currently opened archive file path
let currentArchivePath = "";
// Cache of current file list from the archive
let currentFiles: FileItem[] = [];
// Loading state indicator
let isLoading = false;

// --- Dynamic Component Loading --- 

/**
 * Inserts HTML content into a placeholder element.
 * 将HTML内容插入到占位符元素中。
 *
 * @param htmlContent - The HTML string content to insert.
 *                      - 要插入的HTML字符串内容。
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
    }
  } catch (error) {
    console.error(`Failed to insert component '${componentName}':`, error);
    // Optionally show an error to the user if a critical component fails
    // showError(`无法加载界面组件: ${componentName}`);
  }
}

// Import HTML content directly using Vite's ?raw suffix
import titlebarHtml from './ui/components/titlebar.html?raw';
import toolbarHtml from './ui/components/toolbar.html?raw';
import fileExplorerHtml from './ui/components/file-explorer.html?raw';
import statusBarHtml from './ui/components/status-bar.html?raw';
import extractDialogHtml from './ui/components/extract-dialog.html?raw';

/**
 * Loads all necessary UI components by inserting their pre-imported HTML content.
 * 通过插入预先导入的HTML内容来加载所有必需的UI组件。
 */
function loadAllComponents() { // Removed async as it's now synchronous
  console.log("Inserting UI components...");
  loadComponent(titlebarHtml, 'titlebar-placeholder', 'titlebar.html');
  loadComponent(toolbarHtml, 'toolbar-placeholder', 'toolbar.html');
  loadComponent(fileExplorerHtml, 'file-explorer-placeholder', 'file-explorer.html');
  loadComponent(statusBarHtml, 'status-bar-placeholder', 'status-bar.html');
  loadComponent(extractDialogHtml, 'dialog-placeholder', 'extract-dialog.html');
  console.log("All UI components inserted.");
}

/**
 * Initialize the application and set up all UI components.
 * 初始化应用程序并设置所有UI组件。
 * 
 * Responsible for initializing theme, setting up UI elements, and their event handlers.
 * 负责初始化主题，设置UI元素及其事件处理程序。
 */
async function initializeApp() { // Keep async for potential future async operations
  console.log("Initializing application...");
  
  // Insert HTML components (now synchronous)
  loadAllComponents(); 

  // No need for setTimeout anymore, as innerHTML is set synchronously with bundled content
  // The DOM modification should be reflected immediately in this case.
  console.log("Running setup functions after component insertion...");

  // Initialize theme settings
  initializeTheme();

  // --- Setup event listeners BEFORE setting up UI elements that depend on state ---
  
  // NOTE: File drop/association open events listener would go here

  // NOTE: Cleanup handler when window closes
  // window.addEventListener('beforeunload', () => {
  //   unlisten();
  // });

  // --- Setup UI components with their dependencies and callbacks --- 
  setupWindowControls(); 
  setupMenuItems({ openArchiveDialog });
  setupSearch({ performSearch });
  setupNavButtons({
    isLoading: () => isLoading,
    canGoBack: () => navigationHistory.canGoBack(),
    getPreviousPath: () => navigationHistory.getPreviousPath(),
    canGoForward: () => navigationHistory.canGoForward(),
    getNextPath: () => navigationHistory.getNextPath(),
    getCurrentPath: () => navigationHistory.getCurrentPath(),
    getParentPath: (path) => navigationHistory.getParentPath(path),
    refreshUI: refreshUI,
    navigateToFolder: navigateToFolder,
    getArchivePath: () => currentArchivePath,
    updateLoadingStatus: updateLoadingStatus,
    setCurrentFiles: (files: FileItem[]) => { currentFiles = files; } 
  });
  setupToolbarButtons({ getArchivePath: () => currentArchivePath, openArchiveDialog, startExtraction });
  setupHomeActions({ openArchiveDialog });
  setupLogoClick({
    getArchivePath: () => currentArchivePath,
    confirm: (msg) => window.confirm(msg),
    resetApp: () => {
      currentArchivePath = '';
      currentFiles = [];
      showHomePage(); // Reset should show home page
      setWindowTitle('未打开文件');
      updateStatusBar();
      updateToolbarButtonsState(false); // Disable extract on reset
    }
  });
  setupSettingsButton({});
  
  // --- Initial View Logic --- 
  // Show home page on startup
  showHomePage(); 
  updateToolbarButtonsState(false); 
  
  // Initialize status bar content
  updateStatusBar();

  console.log("Application initialized.");
}

/**
 * Open a file dialog for selecting an archive file.
 * 打开文件对话框以选择压缩包文件。
 * 
 * Handles successful selection by loading the archive or logs cancellation.
 * 处理成功选择的情况（加载压缩包），或记录取消操作。
 */
async function openArchiveDialog() {
  try {
    console.log("Opening archive dialog...");
    const selected = await selectArchiveFile();
    
    if (selected) {
      console.log(`Archive selected: ${selected}`);
      await loadArchive(selected);
    } else {
      console.log("Archive selection cancelled.");
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    showError(`打开文件对话框失败: ${error}`);
  }
}

/**
 * Load an archive file and display its contents.
 * 加载压缩包文件并显示其内容。
 * 
 * Updates the UI with file list, resets navigation history, and handles errors.
 * 更新UI文件列表，重置导航历史，并处理错误。
 * 
 * @param archivePath - Path to the archive file to be loaded
 *                    - 要加载的压缩包文件路径
 */
async function loadArchive(archivePath: string) {
  try {
    updateLoadingStatus(true, "正在读取压缩包...");
    console.log(`Starting to open archive: ${archivePath}`);
    const files = await openArchive(archivePath);
    console.log(`Successfully retrieved file list with ${files.length} items`);
    
    currentArchivePath = archivePath;
    currentFiles = files;
    
    navigationHistory.reset(""); // Reset navigation to root
    showFileBrowser();
    
    // Set window title BEFORE refreshing UI, just in case
    const archiveFileName = getFileNameFromPath(archivePath);
    console.log(`[main] Attempting to set window title to: "${archiveFileName}"`);
    await setWindowTitle(archiveFileName); 
    console.log(`[main] setWindowTitle invoked for: "${archiveFileName}"`);
    
    console.log("Refreshing UI...");
    refreshUI();
    console.log("UI refresh complete");
    
    showSuccess(`成功打开压缩包: ${getFileNameFromPath(archivePath)}`);
    updateToolbarButtonsState(true);

  } catch (error) {
    console.error('Failed to open archive:', error);
    showError(`打开压缩包失败: ${error}`);
    showHomePage(); // Return to home page on failure
    updateToolbarButtonsState(false);
  } finally {
    updateLoadingStatus(false);
  }
}

/**
 * Refresh the UI based on current application state.
 * 根据当前应用程序状态刷新UI。
 * 
 * Updates file list, navigation path display, nav buttons, and status bar.
 * 更新文件列表、路径导航显示、导航按钮和状态栏。
 */
function refreshUI() {
  const currentFolder = navigationHistory.getCurrentPath();
  console.log(`Refreshing UI, current folder: "${currentFolder}"`);
  
  // Filter files to show only those in the current folder
  const filteredFiles = filterFilesByFolder(currentFiles, currentFolder);
  
  // Sort files (directories first, then by name)
  const sortedFiles = sortFiles(filteredFiles);
  
  // Update file list UI component
  updateFileList(
    sortedFiles, 
    currentFolder, 
    undefined, // onFileClick (can be implemented later)
    (file: FileItem) => { // onFileDblClick
        if (isLoading) return; // Prevent action while loading
        if (file.is_dir) {
          navigateToFolder(file.name);
        } else {
          // File preview functionality is not yet implemented
          console.log(`Attempted to preview file (not implemented): ${file.name}`);
        }
    }
  );
  
  // Update path navigation breadcrumb UI
  updatePathNavigation(
    currentFolder,
    getFileNameFromPath(currentArchivePath),
    navigateToFolder
  );
  
  // Update navigation buttons enabled/disabled states
  updateNavButtonsState();
  
  // Update status bar with current folder stats
  updateStatusBar();
}

/**
 * Navigate to a specific folder within the archive.
 * 导航到压缩包中的特定文件夹。
 * 
 * Adds the path to navigation history and refreshes the UI.
 * 添加路径到导航历史并刷新UI。
 * 
 * @param folderPath - The path to navigate to
 *                   - 要导航到的路径
 */
function navigateToFolder(folderPath: string) {
  console.log(`Navigating to folder: ${folderPath}`);
  if (isLoading) return; // Prevent navigation while loading
  
  const normalizedPath = normalizeFolderPath(folderPath);
  navigationHistory.addPath(normalizedPath);
  refreshUI();
}

/**
 * Update the application loading state and UI.
 * 更新应用程序加载状态和UI。
 * 
 * Shows/hides spinner and updates status text.
 * 显示/隐藏加载动画并更新状态文本。
 * 
 * @param loading - Whether the application is in loading state
 *                - 应用程序是否处于加载状态
 * @param message - Optional status message to display while loading
 *                - 加载时显示的可选状态消息
 */
function updateLoadingStatus(loading: boolean, message: string = "") {
  isLoading = loading;
  setLoading(loading); // Update file list UI loading state
  
  const statusTextElement = document.getElementById('status-text');
  const spinnerElement = document.getElementById('status-spinner');

  if (statusTextElement) {
    if (loading) {
      statusTextElement.textContent = message; 
      document.body.classList.add('loading'); // Add loading class to body
      if (spinnerElement) {
        spinnerElement.style.display = 'inline-block'; // Show spinner
      }
    } else {
      document.body.classList.remove('loading');
      updateStatusBar(); // Restore default status bar text
      if (spinnerElement) {
        spinnerElement.style.display = 'none'; // Hide spinner
      }
    }
  }
}

/**
 * Update the status bar with current information.
 * 使用当前信息更新状态栏。
 * 
 * Shows item count and total size for current folder, or welcome message if no archive is open.
 * 显示当前文件夹的项目数和总大小，如果没有打开压缩包则显示欢迎消息。
 */
function updateStatusBar() {
  const statusTextElement = document.getElementById('status-text');
  const statusRight = document.querySelector('.status-right');
  
  if (!statusTextElement || !statusRight) return;
  
  if (!currentArchivePath) {
    // No archive is open, show welcome message
    statusTextElement.textContent = '欢迎使用 Soar Zip';
    statusRight.textContent = '版本: 0.1.0';
    return;
  }
  
  // Get statistics for current folder
  const currentFolder = navigationHistory.getCurrentPath();
  const stats = getFileStats(currentFiles, currentFolder);
  
  // Update status bar with item count and total size
  statusTextElement.textContent = `${stats.count}个项目`;
  statusRight.textContent = `总大小: ${formatFileSize(stats.totalSize)}`;
}

/**
 * Perform search within the current folder.
 * 在当前文件夹中执行搜索。
 * 
 * Filters files by search query and updates the UI to show results.
 * 按搜索查询过滤文件并更新UI以显示结果。
 * 
 * @param query - The search query string
 *              - 搜索查询字符串
 */
function performSearch(query: string) {
  console.log(`Performing search for: "${query}"`);
  if (!currentArchivePath) {
    showError('请先打开一个压缩包');
    return;
  }
  
  const currentFolder = navigationHistory.getCurrentPath();
  // Search within current folder only
  const filesToSearch = filterFilesByFolder(currentFiles, currentFolder);
  
  // Filter files by display name containing search query (case insensitive)
  const searchResults = filesToSearch.filter(file => {
    const displayName = getFileNameFromPath(file.name) || file.name; 
    return displayName.toLowerCase().includes(query.toLowerCase());
  });
  
  console.log(`Search found ${searchResults.length} results.`);
  
  // Update file list with search results
  updateFileList(sortFiles(searchResults), currentFolder);
  
  // Update status bar to show search result count
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    statusLeft.textContent = `找到 ${searchResults.length} 个匹配项`;
  }
  
  // Show notification if no results found
  if (searchResults.length === 0) {
    showInfo(`未找到匹配 "${query}" 的文件`);
  }
}

/**
 * Start the extraction process by showing the extract dialog.
 * 通过显示解压对话框启动解压流程。
 * 
 * Checks if an archive is open and retrieves selected files for extraction.
 * 检查是否有打开的压缩包，并获取要解压的已选文件。
 */
async function startExtraction() {
  console.log("Starting extraction process...");
  if (!currentArchivePath) {
    showError("没有打开的压缩包，无法解压。");
    return;
  }

  // Get list of selected files to extract
  const filesToExtract = getSelectedFiles();
  const numSelected = filesToExtract.length;
  console.log(`Selected files/folders (${numSelected}):`, filesToExtract);

  // Generate default extraction path based on archive location
  const defaultPath = getDefaultExtractPath(currentArchivePath);

  // Show extraction confirmation dialog with callbacks
  showExtractDialog(
    defaultPath,
    // "Change" button callback: open native folder picker
    async () => {
      console.log("Change path triggered...");
      try {
        const selected = await selectDestinationFolder();
        console.log("New path selection result:", selected);
        return selected; // Return selected path or null
      } catch (error) {
        console.error("Error selecting destination folder:", error);
        showError(`选择文件夹失败: ${error}`);
        return null;
      }
    },
    // "Confirm" button callback
    (confirmedPath: string) => {
      console.log(`Extraction confirmed to: ${confirmedPath}`);
      // Perform the actual extraction
      performExtraction(confirmedPath, filesToExtract);
    },
    // "Cancel" button callback
    () => {
      console.log("Extraction operation cancelled.");
    }
  );
}

/**
 * Perform the actual extraction operation.
 * 执行实际的解压操作。
 * 
 * Handles loading state, backend extraction call, and success/error notifications.
 * 处理加载状态、后端解压调用以及成功/错误通知。
 * 
 * @param destination - The destination folder path
 *                    - 目标文件夹路径
 * @param filesToExtract - Array of file paths to extract
 *                       - 要解压的文件路径数组
 */
async function performExtraction(destination: string, filesToExtract: string[]) {
  const numSelected = filesToExtract.length;
  const archiveFileName = getFileNameFromPath(currentArchivePath);
  
  // Create appropriate loading message based on selection
  const loadingMessage = numSelected > 0 
    ? `正在解压 ${numSelected} 个项目从 ${archiveFileName}...` 
    : `正在解压 ${archiveFileName}...`;
  
  try {
    // Update UI to show loading state
    updateLoadingStatus(true, loadingMessage);
    console.log(`Starting backend extraction: archive=${currentArchivePath}, files=${filesToExtract.length}, dest=${destination}`);
    
    // Call backend to perform extraction
    await extractFiles(currentArchivePath, filesToExtract, destination);

    console.log("Backend extraction command completed");
    showSuccess(`文件已成功解压到: ${destination}`);

  } catch (error) {
    console.error("Error during extraction:", error);
    showError(`解压失败: ${error}`);
  } finally {
    // Reset loading state when finished
    updateLoadingStatus(false);
  }
}

// Initialize app when DOM is fully loaded
window.addEventListener("DOMContentLoaded", initializeApp);
