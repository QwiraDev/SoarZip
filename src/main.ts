import { formatFileSize } from "./utils";
import { 
  FileItem, 
  openArchive, 
  selectArchiveFile, 
  filterFilesByFolder, 
  sortFiles, 
  getFileStats 
} from "./services/fileService";
import { 
  minimizeWindow, 
  maximizeWindow, 
  closeWindow, 
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
  // 设置窗口控制
  setupWindowControls();
  
  // 设置菜单项
  setupMenuItems();
  
  // 设置搜索功能
  setupSearch();
  
  // 设置导航按钮
  setupNavButtons();
  
  // 设置工具栏按钮
  setupToolbarButtons();
  
  // 设置主页按钮
  setupHomeActions();
  
  // 设置logo点击
  setupLogoClick();
  
  // 默认显示主页并隐藏工具栏
  showHomePage();
  
  // 更新状态栏
  updateStatusBar();
}

// 窗口控制功能
function setupWindowControls() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  minimizeBtn?.addEventListener('click', minimizeWindow);
  maximizeBtn?.addEventListener('click', maximizeWindow);
  closeBtn?.addEventListener('click', closeWindow);
}

// 菜单点击处理
function setupMenuItems() {
  // 处理主菜单按钮点击 - 显示/隐藏下拉菜单
  const menuContainers = document.querySelectorAll('.menu-container');
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(menuItem => {
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止事件冒泡
      
      // 关闭所有其他打开的菜单
      menuContainers.forEach(container => {
        if (container !== menuItem.parentElement) {
          container.querySelector('.dropdown-menu')?.classList.remove('show');
        }
      });
      
      // 切换当前菜单的显示状态
      const dropdown = menuItem.parentElement?.querySelector('.dropdown-menu');
      dropdown?.classList.toggle('show');
    });
  });
  
  // 处理下拉菜单项点击
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      // 阻止冒泡防止触发父元素事件
      e.stopPropagation();
      
      const itemText = (item as HTMLElement).textContent;
      console.log(`菜单项 ${itemText} 被点击`);
      
      // 关闭当前打开的下拉菜单
      const dropdown = item.closest('.dropdown-menu');
      dropdown?.classList.remove('show');
      
      // 处理特定菜单项
      if (itemText === '打开') {
        await openArchiveDialog();
      } else if (itemText === '新建压缩') {
        // 新建压缩包逻辑（后续实现）
        showError('该功能正在开发中...');
      } else if (itemText === '退出') {
        window.close();
      }
    });
  });
  
  // 点击页面其他部分关闭所有下拉菜单
  document.addEventListener('click', () => {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  });
}

// 设置主页按钮
function setupHomeActions() {
  const openArchiveBtn = document.getElementById('open-archive-btn');
  const newArchiveBtn = document.getElementById('new-archive-btn');
  
  openArchiveBtn?.addEventListener('click', openArchiveDialog);
  
  newArchiveBtn?.addEventListener('click', () => {
    // 新建压缩包逻辑（后续实现）
    showError('该功能正在开发中...');
  });
}

// 打开压缩包对话框
async function openArchiveDialog() {
  try {
    // 打开原生文件选择对话框
    const selected = await selectArchiveFile();
    
    if (selected) {
      // 打开选择的压缩包
      await loadArchive(selected);
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
    
    // 调用后端打开压缩包
    console.log(`开始打开压缩包: ${archivePath}`);
    const files = await openArchive(archivePath);
    console.log(`成功获取文件列表，共${files.length}个项目`);
    console.log("前10个文件:", files.slice(0, 10));
    
    // 更新当前压缩包路径
    currentArchivePath = archivePath;
    currentFiles = files;
    
    // 重置导航历史
    navigationHistory.reset("");
    
    // 切换到文件浏览页面
    showFileBrowser();
    
    // 更新UI
    console.log("开始刷新UI...");
    refreshUI();
    console.log("UI刷新完成");
    
    // 更新窗口标题
    setWindowTitle(getFileNameFromPath(archivePath));
    
    showSuccess(`成功打开压缩包: ${getFileNameFromPath(archivePath)}`);
  } catch (error) {
    console.error('打开压缩包失败:', error);
    showError(`打开压缩包失败: ${error}`);
    
    // 如果打开失败，返回主页
    showHomePage();
  } finally {
    updateLoadingStatus(false);
  }
}

// 刷新UI，根据当前状态更新所有UI组件
function refreshUI() {
  const currentFolder = navigationHistory.getCurrentPath();
  console.log(`刷新UI，当前文件夹: "${currentFolder}"`);
  
  // 过滤并排序当前文件夹下的文件
  const filteredFiles = filterFilesByFolder(currentFiles, currentFolder);
  console.log(`过滤后文件数量: ${filteredFiles.length}`);
  
  const sortedFiles = sortFiles(filteredFiles);
  console.log(`排序后准备显示文件数量: ${sortedFiles.length}`);
  
  if (sortedFiles.length === 0) {
    console.log("警告: 没有文件可显示!");
    if (currentFiles.length > 0) {
      console.log("但是currentFiles中有文件，可能是过滤逻辑问题");
      console.log("currentFiles示例:", currentFiles.slice(0, 3));
    }
  }
  
  // 更新文件列表
  updateFileList(
    sortedFiles, 
    currentFolder, 
    undefined, // 文件点击回调
    file => {
      // 文件双击处理
      if (file.is_dir) {
        navigateToFolder(file.name);
      } else {
        // 文件预览（后续实现）
        showInfo(`预览功能尚未实现: ${file.name}`);
      }
    }
  );
  
  // 更新导航路径
  updatePathNavigation(
    currentFolder,
    getFileNameFromPath(currentArchivePath),
    navigateToFolder
  );
  
  // 更新导航按钮状态
  updateNavButtonsState();
  
  // 更新状态栏
  updateStatusBar();
}

// 导航到指定文件夹
function navigateToFolder(folderPath: string) {
  console.log(`导航到文件夹: ${folderPath}`);
  
  // 如果正在加载，忽略该请求
  if (isLoading) {
    return;
  }
  
  // 标准化文件夹路径
  const normalizedPath = normalizeFolderPath(folderPath);
  
  // 更新导航历史
  navigationHistory.addPath(normalizedPath);
  
  // 刷新UI
  refreshUI();
}

// 更新加载状态
function updateLoadingStatus(loading: boolean, message: string = "") {
  isLoading = loading;
  setLoading(loading);
  
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    if (loading) {
      statusLeft.textContent = message;
      
      // 添加加载指示器
      document.body.classList.add('loading');
    } else {
      document.body.classList.remove('loading');
      updateStatusBar();
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
    statusRight.textContent = '版本: 0.1.0';
    return;
  }
  
  const currentFolder = navigationHistory.getCurrentPath();
  const stats = getFileStats(currentFiles, currentFolder);
  
  statusLeft.textContent = `${stats.count}个项目`;
  statusRight.textContent = `总大小: ${formatFileSize(stats.totalSize)}`;
}

// 搜索功能设置
function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  
  // 搜索按钮点击
  searchBtn?.addEventListener('click', () => {
    const searchText = (searchInput as HTMLInputElement)?.value;
    if (searchText) {
      performSearch(searchText);
    }
  });
  
  // 按下回车键时也触发搜索
  searchInput?.addEventListener('keypress', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const searchText = (searchInput as HTMLInputElement)?.value;
      if (searchText) {
        performSearch(searchText);
      }
    }
  });
}

// 执行搜索的函数
function performSearch(query: string) {
  if (!currentArchivePath) {
    showError('请先打开一个压缩包');
    return;
  }
  
  const currentFolder = navigationHistory.getCurrentPath();
  const filteredFiles = filterFilesByFolder(currentFiles, currentFolder);
  
  // 在当前文件夹下搜索文件
  const searchResults = filteredFiles.filter(file => {
    const displayName = file.name.split('/').pop() || '';
    return displayName.toLowerCase().includes(query.toLowerCase());
  });
  
  // 更新文件列表显示搜索结果
  updateFileList(searchResults, currentFolder);
  
  // 更新状态栏
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    statusLeft.textContent = `找到 ${searchResults.length} 个匹配项`;
  }
  
  if (searchResults.length === 0) {
    showInfo(`未找到匹配"${query}"的文件`);
  }
}

// 导航按钮处理
function setupNavButtons() {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  const refreshBtn = document.querySelector('.nav-btn[title="刷新"]');
  
  // 后退按钮点击
  backBtn?.addEventListener('click', () => {
    if (isLoading || !navigationHistory.canGoBack()) return;
    
    const prevPath = navigationHistory.getPreviousPath();
    if (prevPath !== null) {
      refreshUI();
    }
  });
  
  // 前进按钮点击
  forwardBtn?.addEventListener('click', () => {
    if (isLoading || !navigationHistory.canGoForward()) return;
    
    const nextPath = navigationHistory.getNextPath();
    if (nextPath !== null) {
      refreshUI();
    }
  });
  
  // 上一级按钮点击
  upBtn?.addEventListener('click', () => {
    if (isLoading) return;
    
    const currentPath = navigationHistory.getCurrentPath();
    if (currentPath) {
      const parentPath = navigationHistory.getParentPath(currentPath);
      navigateToFolder(parentPath);
    }
  });
  
  // 刷新按钮点击
  refreshBtn?.addEventListener('click', async () => {
    if (isLoading || !currentArchivePath) return;
    
    try {
      updateLoadingStatus(true, "正在刷新...");
      
      // 重新加载当前压缩包
      const files = await openArchive(currentArchivePath);
      currentFiles = files;
      
      // 刷新UI
      refreshUI();
      
      showSuccess("刷新完成");
    } catch (error) {
      console.error('刷新失败:', error);
      showError(`刷新失败: ${error}`);
    } finally {
      updateLoadingStatus(false);
    }
  });
}

// 工具栏按钮处理
function setupToolbarButtons() {
  const toolButtons = document.querySelectorAll('.tool-btn');
  
  toolButtons.forEach(button => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('title');
      console.log(`工具按钮 ${title} 被点击`);
      
      if (!currentArchivePath && title !== '添加文件') {
        showError('请先打开一个压缩包');
        return;
      }
      
      // 根据不同按钮执行不同操作
      switch(title) {
        case '添加文件':
          if (!currentArchivePath) {
            openArchiveDialog();
          } else {
            // 添加文件逻辑（后续实现）
            showError('该功能正在开发中...');
          }
          break;
        case '提取文件':
        case '剪切':
        case '复制':
        case '粘贴':
        case '重命名':
        case '移动':
        case '删除':
        case '新建文件夹':
        case '属性':
          // 所有未实现的功能显示相同的错误信息
          showError('该功能正在开发中...');
          break;
      }
    });
  });
}

// 主页LOGO点击处理
function setupLogoClick() {
  const logo = document.querySelector('.logo');
  
  logo?.addEventListener('click', () => {
    if (currentArchivePath) {
      // 如果已经打开了压缩包，询问是否返回主页
      if (confirm('是否返回主页？当前压缩包将被关闭。')) {
        currentArchivePath = '';
        currentFiles = [];
        showHomePage();
        setWindowTitle('未打开文件');
        updateStatusBar();
      }
    }
  });
}

// 初始化应用
window.addEventListener("DOMContentLoaded", initializeApp);
