/**
 * 文件浏览器UI组件 - 处理文件列表显示
 */
import { formatFileSize, formatDate } from "../utils";
import { FileItem, getDisplayName, getFileIcon } from "../services/fileService";
import { showInfo } from "./notification";

// 类型定义传递给回调
type FileClickHandler = (file: FileItem, event: MouseEvent) => void;
type FileDblClickHandler = (file: FileItem) => void;

let isLoading = false;
let selectedFiles = new Set<string>();
let lastClickedIndex = -1;
let currentRenderedFiles: FileItem[] = [];

// 存储传递的回调函数引用
let currentOnFileClick: FileClickHandler | undefined;
let currentOnFileDblClick: FileDblClickHandler | undefined;

/**
 * 更新文件列表UI
 * @param files 要显示的文件列表
 * @param currentFolder 当前文件夹路径
 * @param onFileClick 文件点击回调
 * @param onFileDblClick 文件双击回调
 */
export function updateFileList(
  files: FileItem[],
  currentFolder: string,
  onFileClick?: FileClickHandler,
  onFileDblClick?: FileDblClickHandler
): void {
  console.log(`updateFileList: 开始渲染${files.length}个文件项`);
  currentRenderedFiles = files;
  selectedFiles.clear();
  lastClickedIndex = -1;
  // 保存回调函数的引用
  currentOnFileClick = onFileClick;
  currentOnFileDblClick = onFileDblClick;

  const fileListBody = document.querySelector<HTMLElement>('.file-list-body');
  if (!fileListBody) {
    console.error('找不到文件列表容器元素 .file-list-body');
    return;
  }

  // 移除并重新添加监听器以确保使用最新的回调引用
  fileListBody.removeEventListener('click', handleFileListClick);
  fileListBody.removeEventListener('dblclick', handleFileListDblClick);

  fileListBody.addEventListener('click', handleFileListClick);
  fileListBody.addEventListener('dblclick', handleFileListDblClick);

  const BATCH_SIZE = 100;
  const RENDER_DELAY = 10;

  // const fragment = document.createDocumentFragment(); // 移除未使用的 fragment

  fileListBody.classList.add('fade-out');

  fileListBody.innerHTML = '';

  if (files.length === 0) {
    console.log('没有文件可显示，显示空文件夹提示');
    fileListBody.innerHTML = '<div class="empty-folder">此文件夹为空</div>';
    fileListBody.classList.remove('fade-out');
    return;
  }

  function renderBatch(startIndex: number) {
    // 不需要在此处重新检查 fileListBody，因为如果它开始时为 null，函数会提前返回。
    // TypeScript 可能仍然警告，但逻辑上是安全的。
    console.log(`renderBatch: 渲染从${startIndex}开始的批次`);
    const endIndex = Math.min(startIndex + BATCH_SIZE, files.length);
    const batchFragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
      const file = files[i];
      appendFileItem(batchFragment, file, currentFolder, i);
    }
    // 使用可选链操作符确保类型安全
    fileListBody?.appendChild(batchFragment);

    if (endIndex < files.length) {
      console.log(`renderBatch: 还有${files.length - endIndex}个项目待渲染`);
      setTimeout(() => {
        renderBatch(endIndex);
      }, RENDER_DELAY);
    } else {
      console.log('renderBatch: 所有批次渲染完成');
      // 再次确认 fileListBody 存在（理论上不需要，但为了消除TS警告）
      if (fileListBody) {
          fileListBody.classList.remove('fade-out');
          fileListBody.classList.add('fade-in');
      }

      setTimeout(() => {
        // 使用 optional chaining 来消除 TS 警告
        fileListBody?.classList.remove('fade-in');
      }, 300);
    }
  }

  console.log('开始批次渲染文件列表');
  renderBatch(0);
}

function handleFileListClick(event: MouseEvent): void {
  if (isLoading) return;

  const target = event.target as HTMLElement;
  const fileItemElement = target.closest<HTMLElement>('.file-item');

  if (fileItemElement) {
    const filePath = fileItemElement.dataset.filename;
    const fileIndex = parseInt(fileItemElement.dataset.index || '-1', 10);

    if (!filePath || fileIndex === -1) return;

    const file = currentRenderedFiles[fileIndex];
    if (!file) return;

    const ctrlPressed = event.ctrlKey || event.metaKey;
    const shiftPressed = event.shiftKey;

    // 处理选择逻辑...
    if (shiftPressed && lastClickedIndex !== -1) {
      const start = Math.min(lastClickedIndex, fileIndex);
      const end = Math.max(lastClickedIndex, fileIndex);
      if (!ctrlPressed) {
          selectedFiles.clear();
      }
      for (let i = start; i <= end; i++) {
        selectedFiles.add(currentRenderedFiles[i].name);
      }
    } else if (ctrlPressed) {
      if (selectedFiles.has(filePath)) {
        selectedFiles.delete(filePath);
      } else {
        selectedFiles.add(filePath);
      }
      lastClickedIndex = fileIndex;
    } else {
      selectedFiles.clear();
      selectedFiles.add(filePath);
      lastClickedIndex = fileIndex;
    }

    updateSelectionVisuals();

    // 调用 onFileClick 回调 (如果存在)
    if (currentOnFileClick) {
        currentOnFileClick(file, event);
    }

  } else {
    // 点击了空白区域
    selectedFiles.clear();
    lastClickedIndex = -1;
    updateSelectionVisuals();
  }
}

function handleFileListDblClick(event: MouseEvent): void {
  if (isLoading) return;

  const target = event.target as HTMLElement;
  const fileItemElement = target.closest<HTMLElement>('.file-item');

  if (fileItemElement) {
    const fileIndex = parseInt(fileItemElement.dataset.index || '-1', 10);
    if (fileIndex === -1) return;

    const file = currentRenderedFiles[fileIndex];
    if (!file) return;

    selectedFiles.clear();
    lastClickedIndex = -1;
    updateSelectionVisuals();

    let defaultBehaviorPrevented = false;
    // 调用 onFileDblClick 回调 (如果存在)
    if (currentOnFileDblClick) {
        // 可以设计让回调返回 true 来阻止默认行为，但暂时不实现
        currentOnFileDblClick(file);
    }

    // 执行默认行为 (如果回调没有阻止)
    if (!defaultBehaviorPrevented) {
        if (file.is_dir) {
          console.log(`触发双击导航到: ${file.name}`);
          const navigateEvent = new CustomEvent('navigate-folder', { detail: { path: file.name } });
          document.dispatchEvent(navigateEvent);
        } else {
          showInfo(`预览功能尚未实现: ${getDisplayName(file, '')}`);
        }
    }
  }
}

function updateSelectionVisuals(): void {
  const fileListBody = document.querySelector('.file-list-body');
  if (!fileListBody) return;

  fileListBody.querySelectorAll('.file-item').forEach(item => {
    const element = item as HTMLElement;
    const filePath = element.dataset.filename;
    if (filePath && selectedFiles.has(filePath)) {
      element.classList.add('selected');
    } else {
      element.classList.remove('selected');
    }
  });
}

function appendFileItem(
  container: DocumentFragment | HTMLElement,
  file: FileItem,
  currentFolder: string,
  index: number
): void {
  const displayName = getDisplayName(file, currentFolder);
  const icon = getFileIcon(file);

  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.dataset.filename = file.name;
  fileItem.dataset.index = index.toString();

  fileItem.innerHTML = `
    <div class="file-column file-name">
      ${icon}
      <span>${displayName}</span>
    </div>
    <div class="file-column">${formatDate(file.modified_date)}</div>
    <div class="file-column">${file.type_name}</div>
    <div class="file-column">${file.is_dir ? '-' : formatFileSize(file.size)}</div>
  `;

  container.appendChild(fileItem);
}

export function setLoading(loading: boolean): void {
  isLoading = loading;
  const fileListBody = document.querySelector<HTMLElement>('.file-list-body');

  if (fileListBody) {
      fileListBody.style.pointerEvents = loading ? 'none' : 'auto';
      fileListBody.classList.toggle('disabled-interaction', loading);
  }
}

export function showFileBrowser(): void {
  console.log('切换到文件浏览页面');
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector('.toolbar') as HTMLElement | null;
  
  if (!homePage || !fileBrowser) {
    console.error('找不到UI元素: homePage 或 fileBrowser');
    return;
  }
  
  homePage.style.display = 'none';
  fileBrowser.style.display = 'flex'; // Use flex for the main browser layout

  if (toolbar) {
    console.log("showFileBrowser: Setting toolbar display to 'flex'");
    toolbar.style.display = 'flex'; // Show toolbar
  } else {
    console.error("showFileBrowser: Toolbar element (.toolbar) not found!");
  }
}

export function showHomePage(): void {
  console.log('切换到主页页面');
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector('.toolbar') as HTMLElement | null;
  
  if (!homePage || !fileBrowser) {
    console.error('找不到UI元素: homePage 或 fileBrowser');
    return;
  }
  
  homePage.style.display = 'flex'; // Use flex for home page layout
  fileBrowser.style.display = 'none';

  if (toolbar) {
    console.log("showHomePage: Setting toolbar display to 'none'");
    toolbar.style.display = 'none'; // Hide toolbar
  } else {
    console.error("showHomePage: Toolbar element (.toolbar) not found!");
  }
}

export function updatePathNavigation(
  currentFolder: string,
  archiveName: string,
  onFolderClick: (path: string) => void
): void {
  const navPath = document.querySelector('.nav-path');
  if (!navPath) return;
  
  navPath.innerHTML = '';
  
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
  
  archiveElement.addEventListener('click', () => {
    onFolderClick("");
  });
  
  navPath.appendChild(archiveElement);
  
  if (currentFolder) {
    const folders = currentFolder.split('/').filter(Boolean);
    let currentPath = '';
    
    folders.forEach((folder) => {
      const separator = document.createElement('span');
      separator.className = 'path-separator';
      separator.textContent = '>';
      navPath.appendChild(separator);
      
      currentPath += folder + '/';
      const folderElement = document.createElement('span');
      folderElement.className = 'path-item';
      folderElement.textContent = folder;
      
      const pathToNavigate = currentPath;
      folderElement.addEventListener('click', () => {
        onFolderClick(pathToNavigate);
      });
      
      navPath.appendChild(folderElement);
    });
  }
}

// Function to get the list of selected file paths
export function getSelectedFiles(): string[] {
  return Array.from(selectedFiles);
} 