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

// Import setup modules
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

// 导入样式
import "./styles/main.css";

// 当前打开的压缩包路径
let currentArchivePath = "";
// 当前文件列表缓存
let currentFiles: FileItem[] = [];
// 加载状态变量
let isLoading = false;

// 应用初始化
async function initializeApp() {
  console.log("Initializing application...");
  
  // 初始化主题
  initializeTheme();

  // --- Setup event listeners BEFORE setting up UI elements that depend on state ---
  
  // Listen for file drop/association open events

  // Handle potential cleanup when window closes (optional)
  // window.addEventListener('beforeunload', () => {
  //   unlisten();
  // });

  // --- Setup UI components --- 
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
  // Explicitly show home page on startup since file listener is removed
  showHomePage(); 
  updateToolbarButtonsState(false); 
  
  // Update status bar initially
  updateStatusBar();

  console.log("Application initialized.");
}

// 打开压缩包对话框
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
    console.error('打开文件对话框失败:', error);
    showError(`打开文件对话框失败: ${error}`);
  }
}

// 加载压缩包并显示内容
async function loadArchive(archivePath: string) {
  try {
    updateLoadingStatus(true, "正在读取压缩包...");
    console.log(`开始打开压缩包: ${archivePath}`);
    const files = await openArchive(archivePath);
    console.log(`成功获取文件列表，共${files.length}个项目`);
    
    currentArchivePath = archivePath;
    currentFiles = files;
    
    navigationHistory.reset(""); // Reset navigation to root
    showFileBrowser();
    
    console.log("开始刷新UI...");
    refreshUI();
    console.log("UI刷新完成");
    
    setWindowTitle(getFileNameFromPath(archivePath));
    showSuccess(`成功打开压缩包: ${getFileNameFromPath(archivePath)}`);
    updateToolbarButtonsState(true);

  } catch (error) {
    console.error('打开压缩包失败:', error);
    showError(`打开压缩包失败: ${error}`);
    showHomePage(); // Return to home page on failure
    updateToolbarButtonsState(false);
  } finally {
    updateLoadingStatus(false);
  }
}

// 刷新UI，根据当前状态更新所有UI组件
function refreshUI() {
  const currentFolder = navigationHistory.getCurrentPath();
  console.log(`刷新UI，当前文件夹: "${currentFolder}"`);
  
  const filteredFiles = filterFilesByFolder(currentFiles, currentFolder);
  // console.log(`过滤后文件数量: ${filteredFiles.length}`); // Debugging
  
  const sortedFiles = sortFiles(filteredFiles);
  // console.log(`排序后准备显示文件数量: ${sortedFiles.length}`); // Debugging
  
  // Update file list UI
  updateFileList(
    sortedFiles, 
    currentFolder, 
    undefined, // onFileClick (can be implemented later)
    (file: FileItem) => { // onFileDblClick
        if (isLoading) return; // Prevent action while loading
        if (file.is_dir) {
          navigateToFolder(file.name);
        } else {
          // 暂时移除未实现功能的提示，避免重复
          // showInfo(`预览功能尚未实现: ${file.name}`);
          console.log(`Attempted to preview file (not implemented): ${file.name}`); // Log instead
        }
    }
  );
  
  // Update navigation path UI
  updatePathNavigation(
    currentFolder,
    getFileNameFromPath(currentArchivePath),
    navigateToFolder // Pass the navigation function
  );
  
  updateNavButtonsState();
  updateStatusBar();
}

// 导航到指定文件夹
function navigateToFolder(folderPath: string) {
  console.log(`导航到文件夹: ${folderPath}`);
  if (isLoading) return;
  
  const normalizedPath = normalizeFolderPath(folderPath);
  navigationHistory.addPath(normalizedPath);
  refreshUI();
}

// 更新加载状态
function updateLoadingStatus(loading: boolean, message: string = "") {
  isLoading = loading;
  setLoading(loading); // Update file list UI loading state
  
  const statusTextElement = document.getElementById('status-text');
  const spinnerElement = document.getElementById('status-spinner');

  if (statusTextElement) {
    if (loading) {
      statusTextElement.textContent = message; 
      document.body.classList.add('loading'); // Keep general loading class if needed elsewhere
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

// 更新状态栏信息
function updateStatusBar() {
  const statusTextElement = document.getElementById('status-text');
  const statusRight = document.querySelector('.status-right');
  
  if (!statusTextElement || !statusRight) return;
  
  if (!currentArchivePath) {
    statusTextElement.textContent = '欢迎使用 Soar Zip';
    statusRight.textContent = '版本: 0.1.0'; // Hardcoded version, consider making dynamic
    return;
  }
  
  const currentFolder = navigationHistory.getCurrentPath();
  const stats = getFileStats(currentFiles, currentFolder);
  
  statusTextElement.textContent = `${stats.count}个项目`; // Update only text part
  statusRight.textContent = `总大小: ${formatFileSize(stats.totalSize)}`;
}

// 执行搜索的函数
function performSearch(query: string) {
  console.log(`Performing search for: "${query}"`);
  if (!currentArchivePath) {
    showError('请先打开一个压缩包');
    return;
  }
  
  const currentFolder = navigationHistory.getCurrentPath();
  // Decide search scope: current folder or entire archive?
  // Current implementation: searches only within the *currently displayed* folder.
  const filesToSearch = filterFilesByFolder(currentFiles, currentFolder);
  
  const searchResults = filesToSearch.filter(file => {
    // Get only the final component of the path for display name matching
    const displayName = getFileNameFromPath(file.name) || file.name; 
    return displayName.toLowerCase().includes(query.toLowerCase());
  });
  
  console.log(`Search found ${searchResults.length} results.`);
  // Update file list to show only search results
  updateFileList(sortFiles(searchResults), currentFolder); // Sort search results too
  
  // Update status bar to reflect search results
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    statusLeft.textContent = `找到 ${searchResults.length} 个匹配项`;
  }
  
  if (searchResults.length === 0) {
    showInfo(`未找到匹配 "${query}" 的文件`);
  }
  // Note: Need a way to clear search results and return to normal view.
}

// Implement the extraction logic using the dialog
async function startExtraction() {
  console.log("启动解压流程...");
  if (!currentArchivePath) {
    showError("没有打开的压缩包，无法解压。");
    return;
  }

  const filesToExtract = getSelectedFiles();
  const numSelected = filesToExtract.length;
  console.log(`选中的文件/文件夹 (${numSelected} 个):`, filesToExtract);

  // 生成默认路径
  const defaultPath = getDefaultExtractPath(currentArchivePath);

  // 显示确认对话框
  showExtractDialog(
    defaultPath,
    // "更改"按钮的回调：打开原生文件夹选择器
    async () => {
      console.log("触发更改路径...");
      try {
        const selected = await selectDestinationFolder();
        console.log("新路径选择结果:", selected);
        return selected; // 返回选择的路径或 null
      } catch (error) {
        console.error("选择目标文件夹时出错:", error);
        showError(`选择文件夹失败: ${error}`);
        return null;
      }
    },
    // "确认解压"按钮的回调
    (confirmedPath: string) => {
      console.log(`确认解压到: ${confirmedPath}`);
      // 执行实际的解压操作
      performExtraction(confirmedPath, filesToExtract);
    },
    // "取消"按钮的回调
    () => {
      console.log("解压操作已取消。");
    }
  );
}

// 封装实际的解压调用和状态更新
async function performExtraction(destination: string, filesToExtract: string[]) {
  const numSelected = filesToExtract.length;
  const archiveFileName = getFileNameFromPath(currentArchivePath);
  // Use a more specific loading message
  const loadingMessage = numSelected > 0 
    ? `正在解压 ${numSelected} 个项目从 ${archiveFileName}...` 
    : `正在解压 ${archiveFileName}...`;
  
  try {
    // Pass the specific message and indicate loading start
    updateLoadingStatus(true, loadingMessage);
    console.log(`开始调用后端解压: archive=${currentArchivePath}, files=${filesToExtract.length}, dest=${destination}`);
    
    await extractFiles(currentArchivePath, filesToExtract, destination);

    console.log("后端解压命令执行完成 (前端收到响应)");
    showSuccess(`文件已成功解压到: ${destination}`);

  } catch (error) {
    console.error("解压过程中发生错误:", error);
    showError(`解压失败: ${error}`);
  } finally {
    // Indicate loading end
    updateLoadingStatus(false);
  }
}

// Initialize app on DOMContentLoaded
window.addEventListener("DOMContentLoaded", initializeApp);
