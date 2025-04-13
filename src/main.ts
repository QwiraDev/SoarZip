import { invoke } from "@tauri-apps/api/core";
import { formatFileSize, formatDate } from "./utils.ts";

// 定义文件项类型
interface FileItem {
  name: string;
  is_dir: boolean;
  size: number;
  modified_date: string;
  type_name: string;
}

// 当前打开的压缩包路径
let currentArchivePath = "";
// 当前路径栈，用于导航
let pathHistory: string[] = [];
let currentPathIndex = -1;
// 当前文件夹路径
let currentFolder = "";

// 窗口控制功能
function setupWindowControls() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  minimizeBtn?.addEventListener('click', async () => {
    await invoke('minimize_window');
  });

  maximizeBtn?.addEventListener('click', async () => {
    await invoke('maximize_window');
  });

  closeBtn?.addEventListener('click', async () => {
    await invoke('close_window');
  });
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
  
  openArchiveBtn?.addEventListener('click', async () => {
    await openArchiveDialog();
  });
  
  newArchiveBtn?.addEventListener('click', () => {
    // 新建压缩包逻辑（后续实现）
    showError('该功能正在开发中...');
  });
}

// 切换到文件浏览页面
function showFileBrowser() {
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector('.toolbar');
  
  if (homePage && fileBrowser && toolbar) {
    homePage.style.display = 'none';
    fileBrowser.style.display = 'flex';
    (toolbar as HTMLElement).style.display = 'flex'; // 显示工具栏
  }
}

// 切换到主页
function showHomePage() {
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector('.toolbar');
  
  if (homePage && fileBrowser && toolbar) {
    homePage.style.display = 'flex';
    fileBrowser.style.display = 'none';
    (toolbar as HTMLElement).style.display = 'none'; // 隐藏工具栏
    
    // 重置状态
    const statusLeft = document.querySelector('.status-left');
    const statusRight = document.querySelector('.status-right');
    
    if (statusLeft) {
      statusLeft.textContent = '欢迎使用 Soar Zip';
    }
    
    if (statusRight) {
      statusRight.textContent = '版本: 0.1.0';
    }
    
    // 更新标题
    const currentFile = document.getElementById('current-file');
    if (currentFile) {
      currentFile.textContent = '未打开文件';
    }
  }
}

// 打开压缩包对话框
async function openArchiveDialog() {
  try {
    // 打开原生文件选择对话框
    const selected = await invoke<string | null>('select_archive_file');
    
    if (selected) {
      // 打开选择的压缩包
      openArchive(selected);
    }
  } catch (error) {
    console.error('打开文件对话框失败:', error);
    showError(`打开文件对话框失败: ${error}`);
  }
}

// 打开压缩包并显示内容
async function openArchive(archivePath: string) {
  try {
    // 调用Rust函数打开压缩包
    const files = await invoke<FileItem[]>('open_archive', { archivePath });
    
    // 更新当前压缩包路径
    currentArchivePath = archivePath;
    
    // 重置导航历史
    pathHistory = [""];
    currentPathIndex = 0;
    currentFolder = "";
    
    // 切换到文件浏览页面
    showFileBrowser();
    
    // 更新UI
    updatePathNavigation();
    updateFileList(files);
    updateArchiveTitle();
    
    // 更新状态栏
    updateStatusBar(files);
  } catch (error) {
    console.error('打开压缩包失败:', error);
    showError(`打开压缩包失败: ${error}`);
  }
}

// 更新路径导航UI
function updatePathNavigation() {
  const navPath = document.querySelector('.nav-path');
  if (!navPath) return;
  
  // 清空现有路径项
  navPath.innerHTML = '';
  
  // 添加压缩包根路径
  const archiveName = currentArchivePath.split(/[\/\\]/).pop() || '';
  
  const archiveElement = document.createElement('span');
  archiveElement.className = 'path-item path-archive';
  archiveElement.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8v13H3V8"></path>
      <path d="M1 3h22v5H1z"></path>
      <path d="M10 12h4"></path>
    </svg>
    <span>${archiveName}</span>
  `;
  
  // 点击压缩包名称返回根目录
  archiveElement.addEventListener('click', () => {
    navigateToFolder("");
  });
  
  navPath.appendChild(archiveElement);
  
  // 如果在子文件夹中，添加路径
  if (currentFolder) {
    const folders = currentFolder.split('/').filter(Boolean);
    let currentPath = '';
    
    folders.forEach((folder) => {
      // 添加分隔符
      const separator = document.createElement('span');
      separator.className = 'path-separator';
      separator.textContent = '>';
      navPath.appendChild(separator);
      
      // 添加文件夹路径
      currentPath += folder + '/';
      const folderElement = document.createElement('span');
      folderElement.className = 'path-item';
      folderElement.textContent = folder;
      
      // 设置点击事件导航到该文件夹
      const pathToNavigate = currentPath;
      folderElement.addEventListener('click', () => {
        navigateToFolder(pathToNavigate);
      });
      
      navPath.appendChild(folderElement);
    });
  }
}

// 显示文件列表
function updateFileList(files: FileItem[]) {
  const fileListBody = document.querySelector('.file-list-body');
  if (!fileListBody) return;
  
  // 清空现有文件列表
  fileListBody.innerHTML = '';
  
  // 筛选当前文件夹下的文件和直接子文件夹
  const currentFiles = files.filter(file => {
    // 移除压缩包根路径
    const relativePath = file.name.replace(/^\/\/|\/$/, ''); // 去除开头和结尾的斜杠
    const currentFolderNormalized = currentFolder.replace(/^\/\/|\/$/, ''); // 去除开头和结尾的斜杠
    
    if (currentFolderNormalized === '') {
      // 根目录：只显示没有路径分隔符或者只有一层路径的文件/文件夹
      return !relativePath.includes('/');
    } else {
      // 子文件夹：
      // 1. 必须以当前文件夹路径开头
      // 2. 路径长度必须比当前文件夹长
      // 3. 移除当前文件夹路径后，剩余部分不能再包含路径分隔符
      return relativePath.startsWith(currentFolderNormalized + '/') && 
             !relativePath.substring(currentFolderNormalized.length + 1).includes('/');
    }
  });
  
  // 排序：先文件夹，后文件，按名称排序
  const sortedFiles = [...currentFiles].sort((a, b) => {
    if (a.is_dir !== b.is_dir) {
      return a.is_dir ? -1 : 1;  // 文件夹在前
    }
    return a.name.localeCompare(b.name);  // 按名称排序
  });
  
  // 添加文件和文件夹
  sortedFiles.forEach(file => {
    // 获取显示名称（移除路径前缀）
    let displayName = file.name;
    const currentFolderPrefix = currentFolder.replace(/^\/\/|\/$/, ''); // 去除开头和结尾的斜杠
    if (currentFolderPrefix && displayName.startsWith(currentFolderPrefix + '/')) {
      displayName = displayName.substring(currentFolderPrefix.length + 1);
    }
    displayName = displayName.replace(/\/$/, ''); // 移除末尾的斜杠
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    // 根据是否为文件夹选择不同图标
    const icon = file.is_dir 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>`;
    
    fileItem.innerHTML = `
      <div class="file-column file-name">
        ${icon}
        <span>${displayName}</span>
      </div>
      <div class="file-column">${formatDate(file.modified_date)}</div>
      <div class="file-column">${file.type_name}</div>
      <div class="file-column">${file.is_dir ? '-' : formatFileSize(file.size)}</div>
    `;
    
    // 添加点击事件
    fileItem.addEventListener('click', () => {
      // 清除所有选中状态
      document.querySelectorAll('.file-item.selected').forEach(item => {
        item.classList.remove('selected');
      });
      // 添加选中状态
      fileItem.classList.add('selected');
    });
    
    // 添加双击事件 - 如果是文件夹则进入，如果是文件则预览
    fileItem.addEventListener('dblclick', () => {
      if (file.is_dir) {
        // 导航到子文件夹
        navigateToFolder(file.name);
      } else {
        // 文件预览（后续实现）
        console.log(`预览文件: ${file.name}`);
      }
    });
    
    fileListBody.appendChild(fileItem);
  });
}

// 导航到指定文件夹
function navigateToFolder(folderPath: string) {
  console.log(`导航到文件夹: ${folderPath}`);
  
  // 更新当前文件夹路径
  currentFolder = folderPath.endsWith('/') ? folderPath : folderPath + '/';
  if (folderPath === '') {
    currentFolder = ''; // 确保根目录为空字符串
  }
  
  // 更新导航历史
  if (currentPathIndex < pathHistory.length - 1) {
    // 如果从历史中间导航，截断后面的历史
    pathHistory = pathHistory.slice(0, currentPathIndex + 1);
  }
  
  // 添加新路径到历史
  pathHistory.push(currentFolder);
  currentPathIndex = pathHistory.length - 1;
  
  // 重新加载文件列表
  reloadCurrentArchive();
  
  // 更新UI
  updatePathNavigation();
  updateNavButtonsState();
}

// 重新加载当前压缩包
async function reloadCurrentArchive() {
  if (!currentArchivePath) return;
  
  try {
    const files = await invoke<FileItem[]>('open_archive', { archivePath: currentArchivePath });
    updateFileList(files);
    updateStatusBar(files);
  } catch (error) {
    console.error('重新加载压缩包失败:', error);
    showError(`重新加载压缩包失败: ${error}`);
  }
}

// 更新状态栏信息
function updateStatusBar(files: FileItem[]) {
  const statusLeft = document.querySelector('.status-left');
  const statusRight = document.querySelector('.status-right');
  
  if (!statusLeft || !statusRight) return;
  
  // 计算当前文件夹下的文件数量和总大小
  const currentFiles = files.filter(file => {
    if (currentFolder === '') {
      return !file.name.includes('/') || 
             (file.name.split('/').filter(Boolean).length === 1 && file.name.endsWith('/'));
    } else {
      return file.name.startsWith(currentFolder) && 
             (file.name === currentFolder || 
              file.name.substring(currentFolder.length).split('/').filter(Boolean).length <= 1);
    }
  });
  
  const fileCount = currentFiles.length;
  const totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0);
  
  statusLeft.textContent = `${fileCount}个项目`;
  statusRight.textContent = `总大小: ${formatFileSize(totalSize)}`;
}

// 更新窗口标题显示当前压缩包
function updateArchiveTitle() {
  const currentFile = document.getElementById('current-file');
  if (currentFile) {
    const archiveName = currentArchivePath.split(/[\/\\]/).pop() || '未打开文件';
    currentFile.textContent = archiveName;
  }
}

// 更新导航按钮状态
function updateNavButtonsState() {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  
  if (backBtn) {
    if (currentPathIndex > 0) {
      backBtn.classList.remove('disabled');
    } else {
      backBtn.classList.add('disabled');
    }
  }
  
  if (forwardBtn) {
    if (currentPathIndex < pathHistory.length - 1) {
      forwardBtn.classList.remove('disabled');
    } else {
      forwardBtn.classList.add('disabled');
    }
  }
  
  if (upBtn) {
    if (currentFolder !== '') {
      upBtn.classList.remove('disabled');
    } else {
      upBtn.classList.add('disabled');
    }
  }
}

// 显示错误信息
function showError(message: string) {
  alert(message); // 简单起见先使用alert，后续可以实现更好的错误提示UI
}

// 搜索功能设置
function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  
  // 搜索按钮点击
  searchBtn?.addEventListener('click', () => {
    const searchText = (searchInput as HTMLInputElement)?.value;
    if (searchText) {
      console.log(`搜索: ${searchText}`);
      // 实现搜索逻辑
      performSearch(searchText);
    }
  });
  
  // 按下回车键时也触发搜索
  searchInput?.addEventListener('keypress', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const searchText = (searchInput as HTMLInputElement)?.value;
      if (searchText) {
        console.log(`搜索: ${searchText}`);
        // 实现搜索逻辑
        performSearch(searchText);
      }
    }
  });
}

// 执行搜索的函数
function performSearch(query: string) {
  // 这里实现具体的搜索逻辑
  // 例如：在文件列表中过滤匹配的文件名
  // 或者调用后端的搜索API
  
  // 示例：简单的前端过滤
  const fileItems = document.querySelectorAll('.file-item');
  let matchCount = 0;
  
  fileItems.forEach(item => {
    const fileName = item.querySelector('.file-name span')?.textContent;
    if (fileName && fileName.toLowerCase().includes(query.toLowerCase())) {
      (item as HTMLElement).style.display = 'flex';
      matchCount++;
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });
  
  // 更新状态栏
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    statusLeft.textContent = `找到 ${matchCount} 个匹配项`;
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
    if (currentPathIndex > 0) {
      currentPathIndex--;
      currentFolder = pathHistory[currentPathIndex];
      reloadCurrentArchive();
      updatePathNavigation();
      updateNavButtonsState();
    }
  });
  
  // 前进按钮点击
  forwardBtn?.addEventListener('click', () => {
    if (currentPathIndex < pathHistory.length - 1) {
      currentPathIndex++;
      currentFolder = pathHistory[currentPathIndex];
      reloadCurrentArchive();
      updatePathNavigation();
      updateNavButtonsState();
    }
  });
  
  // 上一级按钮点击
  upBtn?.addEventListener('click', () => {
    if (currentFolder !== '') {
      const parentFolder = currentFolder.split('/').slice(0, -2).join('/') + (currentFolder.split('/').length > 2 ? '/' : '');
      navigateToFolder(parentFolder);
    }
  });
  
  // 刷新按钮点击
  refreshBtn?.addEventListener('click', () => {
    reloadCurrentArchive();
  });
}

// 面包屑导航点击处理
function setupPathNavigation() {
  // 这部分逻辑已经在updatePathNavigation中实现
  // 每次更新路径时会重新设置点击事件
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
          // 提取文件逻辑（后续实现）
          showError('该功能正在开发中...');
          break;
        case '剪切':
        case '复制':
        case '粘贴':
        case '重命名':
        case '移动':
        case '删除':
        case '新建文件夹':
        case '属性':
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
        showHomePage();
      }
    }
  });
}

// 文件项点击处理
function setupFileItems() {
  // 这部分逻辑已经在updateFileList中实现
  // 每次更新文件列表时会重新设置点击事件
}

// 初始化
window.addEventListener("DOMContentLoaded", () => {
  // 设置窗口控制
  setupWindowControls();
  
  // 设置菜单项
  setupMenuItems();
  
  // 设置搜索功能
  setupSearch();
  
  // 设置导航按钮
  setupNavButtons();
  
  // 设置路径导航
  setupPathNavigation();
  
  // 设置工具栏按钮
  setupToolbarButtons();
  
  // 设置文件项
  setupFileItems();
  
  // 设置主页按钮
  setupHomeActions();
  
  // 设置logo点击
  setupLogoClick();
  
  // 默认显示主页并隐藏工具栏
  showHomePage();
});
