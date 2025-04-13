import { formatFileSize } from "./utils/index";
import { 
  FileItem, 
  openArchive, 
  selectArchiveFile, 
  filterFilesByFolder, 
  sortFiles, 
  getFileStats 
} from "./services/fileService";
import { 
  setWindowTitle, 
  getFileNameFromPath 
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
  setLoading 
} from "./ui/fileExplorer";
import { 
  showError, 
  showInfo, 
  showSuccess 
} from "./ui/notification";

// Import setup modules
import { setupWindowControls } from './setup/windowControls';
import { setupMenuItems, MenuDependencies } from './setup/menu';
import { setupHomeActions, HomeActionDependencies } from './setup/home';
import { setupNavButtons, NavigationDependencies } from './setup/navigation';
import { setupToolbarButtons, ToolbarDependencies } from './setup/toolbar';
import { setupSearch, SearchDependencies } from './setup/search';
import { setupLogoClick, LogoClickDependencies } from './setup/logo';

// 导入样式
import "./styles/main.css";

// 当前打开的压缩包路径
let currentArchivePath = "";
// 当前文件列表缓存
let currentFiles: FileItem[] = [];
// 加载状态变量
let isLoading = false;

// 应用初始化
function initializeApp() {
  console.log("Initializing application...");

  // Setup UI components by calling imported functions
  setupWindowControls(); 
  
  setupMenuItems({ 
    openArchiveDialog: openArchiveDialog 
  } as MenuDependencies);
  
  setupSearch({ 
    performSearch: performSearch 
  } as SearchDependencies);

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
  } as NavigationDependencies);

  setupToolbarButtons({
    getArchivePath: () => currentArchivePath,
    openArchiveDialog: openArchiveDialog
  } as ToolbarDependencies);

  setupHomeActions({ 
    openArchiveDialog: openArchiveDialog 
  } as HomeActionDependencies);
  
  setupLogoClick({
    getArchivePath: () => currentArchivePath,
    confirm: (msg) => window.confirm(msg),
    resetApp: () => {
      currentArchivePath = '';
      currentFiles = [];
      showHomePage();
      setWindowTitle('未打开文件');
      updateStatusBar();
    }
  } as LogoClickDependencies);
  
  // Default view
  showHomePage();
  
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
    // console.log("前10个文件:", files.slice(0, 10)); // Keep this for debugging if needed
    
    currentArchivePath = archivePath;
    currentFiles = files;
    
    navigationHistory.reset(""); // Reset navigation to root
    showFileBrowser();
    
    console.log("开始刷新UI...");
    refreshUI();
    console.log("UI刷新完成");
    
    setWindowTitle(getFileNameFromPath(archivePath));
    showSuccess(`成功打开压缩包: ${getFileNameFromPath(archivePath)}`);
  } catch (error) {
    console.error('打开压缩包失败:', error);
    showError(`打开压缩包失败: ${error}`);
    showHomePage(); // Return to home page on failure
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
          showInfo(`预览功能尚未实现: ${file.name}`);
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
  setLoading(loading); // Update UI loading state
  
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    if (loading) {
      statusLeft.textContent = message;
      document.body.classList.add('loading');
    } else {
      document.body.classList.remove('loading');
      updateStatusBar(); // Restore status bar after loading
    }
  }
}

// 更新状态栏信息
function updateStatusBar() {
  const statusLeft = document.querySelector('.status-left');
  const statusRight = document.querySelector('.status-right');
  
  if (!statusLeft || !statusRight) return;
  
  if (!currentArchivePath) {
    statusLeft.textContent = '欢迎使用 Soar Zip';
    statusRight.textContent = '版本: 0.1.0'; // Hardcoded version, consider making dynamic
    return;
  }
  
  const currentFolder = navigationHistory.getCurrentPath();
  const stats = getFileStats(currentFiles, currentFolder);
  
  statusLeft.textContent = `${stats.count}个项目`;
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

// 初始化应用
window.addEventListener("DOMContentLoaded", initializeApp);
