/**
 * 文件浏览器UI组件 - 处理文件列表显示
 */
import { formatFileSize, formatDate } from "../utils";
import { FileItem, getDisplayName, getFileIcon } from "../services/fileService";
import { showInfo } from "./notification";

type FileClickHandler = (file: FileItem) => void;
let isLoading = false;

/**
 * 更新文件列表UI
 * @param files 要显示的文件列表
 * @param onFileClick 文件点击回调
 * @param onFileDblClick 文件双击回调
 */
export function updateFileList(
  files: FileItem[],
  currentFolder: string,
  onFileClick?: FileClickHandler,
  onFileDblClick?: FileClickHandler
): void {
  console.log(`updateFileList: 开始渲染${files.length}个文件项`);
  
  const fileListBody = document.querySelector('.file-list-body');
  if (!fileListBody) {
    console.error('找不到文件列表容器元素 .file-list-body');
    return;
  }
  
  // 虚拟列表优化 - 如果文件数量超过阈值，使用分批渲染
  const BATCH_SIZE = 100; // 每批次显示的文件数量
  const RENDER_DELAY = 10; // 批次间的延迟毫秒数
  
  // 创建文档片段进行离线DOM操作
  const fragment = document.createDocumentFragment();
  
  // 在替换内容前添加淡出效果
  fileListBody.classList.add('fade-out');
  
  // 清空现有文件列表
  fileListBody.innerHTML = '';
  fileListBody.appendChild(fragment);
  
  // 如果没有文件显示空文件夹提示
  if (files.length === 0) {
    console.log('没有文件可显示，显示空文件夹提示');
    fileListBody.innerHTML = '<div class="empty-folder">此文件夹为空</div>';
    fileListBody.classList.remove('fade-out');
    return;
  }
  
  // 分批次渲染函数
  function renderBatch(startIndex: number) {
    console.log(`renderBatch: 渲染从${startIndex}开始的批次`);
    const endIndex = Math.min(startIndex + BATCH_SIZE, files.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const file = files[i];
      appendFileItem(fragment, file, currentFolder, onFileClick, onFileDblClick);
    }
    
    // 如果还有剩余批次，继续渲染
    if (endIndex < files.length) {
      console.log(`renderBatch: 还有${files.length - endIndex}个项目待渲染`);
      setTimeout(() => {
        renderBatch(endIndex);
      }, RENDER_DELAY);
    } else {
      // 所有批次渲染完成，添加淡入效果
      console.log('renderBatch: 所有批次渲染完成');
      
      // 确保文件列表容器存在内容
      if (fileListBody && fileListBody.childNodes.length === 0) {
        console.warn('警告: 渲染完成但文件列表为空，尝试直接添加文档片段');
        fileListBody?.appendChild(fragment);
      }
      fileListBody?.classList.remove('fade-out');
      fileListBody?.classList.add('fade-in');
      
      // 淡入效果完成后移除类
      setTimeout(() => {
        fileListBody?.classList.remove('fade-in');
      }, 300);
    }
    
    // 再次确认文件列表已添加到DOM
    if (fileListBody?.childNodes.length === 0 && files.length > 0) {
      console.warn('警告: 文件列表仍然为空，强制重新渲染');
      const emergency_container = document.createElement('div');
      files.forEach(file => {
        const displayName = getDisplayName(file, currentFolder);
        emergency_container.innerHTML += `<div class="file-item">
          <div class="file-column file-name">
            ${getFileIcon(file)}
            <span>${displayName}</span>
          </div>
          <div class="file-column">${file.modified_date}</div>
          <div class="file-column">${file.type_name}</div>
          <div class="file-column">${file.is_dir ? '-' : file.size}</div>
        </div>`;
      });
      fileListBody.innerHTML = emergency_container.innerHTML;
      fileListBody.classList.remove('fade-out');
    }
  }
  
  // 开始批次渲染
  console.log('开始批次渲染文件列表');
  renderBatch(0);
}

/**
 * 添加文件项到DOM
 */
function appendFileItem(
  container: DocumentFragment | HTMLElement,
  file: FileItem,
  currentFolder: string,
  onFileClick?: FileClickHandler,
  onFileDblClick?: FileClickHandler
): void {
  const displayName = getDisplayName(file, currentFolder);
  const icon = getFileIcon(file);
  
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.dataset.filename = file.name; // 存储完整路径用于查找
  
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
  fileItem.addEventListener('click', (e) => {
    // 如果正在加载，阻止点击事件
    if (isLoading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // 清除所有选中状态
    document.querySelectorAll('.file-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    
    // 添加选中状态
    fileItem.classList.add('selected');
    
    // 执行回调
    if (onFileClick) {
      onFileClick(file);
    }
  });
  
  // 添加双击事件
  fileItem.addEventListener('dblclick', (e) => {
    // 如果正在加载，阻止双击事件
    if (isLoading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (onFileDblClick) {
      onFileDblClick(file);
    } else if (file.is_dir) {
      // 默认行为：导航到文件夹
      console.log(`导航到文件夹: ${file.name}`);
    } else {
      // 默认行为：提示文件预览功能尚未实现
      showInfo(`预览功能尚未实现: ${displayName}`);
    }
  });
  
  container.appendChild(fileItem);
}

/**
 * 设置加载状态
 * @param loading 是否正在加载
 */
export function setLoading(loading: boolean): void {
  isLoading = loading;
  
  // 禁用或启用所有文件项
  const fileItems = document.querySelectorAll('.file-item');
  fileItems.forEach(item => {
    if (loading) {
      (item as HTMLElement).style.pointerEvents = 'none';
      item.classList.add('disabled');
    } else {
      (item as HTMLElement).style.pointerEvents = 'auto';
      item.classList.remove('disabled');
    }
  });
}

/**
 * 切换到文件浏览页面
 */
export function showFileBrowser(): void {
  console.log('切换到文件浏览页面');
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector('.toolbar');
  
  if (!homePage || !fileBrowser || !toolbar) {
    console.error('找不到UI元素:', {
      homePage: !!homePage,
      fileBrowser: !!fileBrowser,
      toolbar: !!toolbar
    });
    return;
  }
  
  homePage.style.display = 'none';
  fileBrowser.style.display = 'flex';
  (toolbar as HTMLElement).style.display = 'flex'; // 显示工具栏
}

/**
 * 切换到主页
 */
export function showHomePage(): void {
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector('.toolbar');
  
  if (homePage && fileBrowser && toolbar) {
    homePage.style.display = 'flex';
    fileBrowser.style.display = 'none';
    (toolbar as HTMLElement).style.display = 'none'; // 隐藏工具栏
  }
}

/**
 * 更新文件路径导航UI
 * @param currentFolder 当前文件夹路径
 * @param archiveName 压缩包名称
 * @param onFolderClick 文件夹点击回调
 */
export function updatePathNavigation(
  currentFolder: string,
  archiveName: string,
  onFolderClick: (path: string) => void
): void {
  const navPath = document.querySelector('.nav-path');
  if (!navPath) return;
  
  // 清空现有路径项
  navPath.innerHTML = '';
  
  // 添加压缩包根路径
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
    onFolderClick("");
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
        onFolderClick(pathToNavigate);
      });
      
      navPath.appendChild(folderElement);
    });
  }
} 