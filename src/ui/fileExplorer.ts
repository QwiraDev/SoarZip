/**
 * File Explorer UI Component - Handles file list display and interaction
 * 文件浏览器UI组件 - 处理文件列表显示和交互
 */
import { formatFileSize, formatDate } from "../utils";
import { FileItem, getDisplayName, getFileIcon } from "../services/fileService";
import { showInfo, showError } from "./notification";
// Import services needed for context menu actions
import { startExtractionProcess } from "../services/extractionService";
// Import navigation service
import { navigateToFolder } from "../ui/uiManager";
// Assuming navigationService exists and handles folder navigation
// 假设 navigationService 存在并处理文件夹导航
// import { navigateTo } from '../services/navigationService'; 

// Type definitions for callback handlers
/**
 * Type definition for the file click handler.
 * 文件点击处理程序类型定义。
 * @param file - The clicked file item.
 *             - 被点击的文件项。
 * @param event - The mouse event.
 *              - 鼠标事件。
 */
type FileClickHandler = (file: FileItem, event: MouseEvent) => void;

/**
 * Type definition for the file double-click handler.
 * 文件双击处理程序类型定义。
 * @param file - The double-clicked file item.
 *             - 被双击的文件项。
 */
type FileDblClickHandler = (file: FileItem) => void;

// State variables
/**
 * Loading state for the file explorer UI.
 * 文件浏览器UI的加载状态。
 */
let isLoading = false;
/**
 * Set of currently selected file paths.
 * 当前选中的文件路径集合。
 */
let selectedFiles = new Set<string>();
/**
 * Index of the last clicked file item, used for shift-selection.
 * 最后点击的文件项索引，用于Shift多选。
 */
let lastClickedIndex = -1;
/**
 * Cache of the files currently rendered in the list.
 * 当前在列表中渲染的文件缓存。
 */
let currentRenderedFiles: FileItem[] = [];

// Store references to callback functions
/**
 * Reference to the current file click handler.
 * 当前文件点击处理程序的引用。
 */
let currentOnFileClick: FileClickHandler | undefined;
/**
 * Reference to the current file double-click handler.
 * 当前文件双击处理程序的引用。
 */
let currentOnFileDblClick: FileDblClickHandler | undefined;

/**
 * Reference to the custom context menu element.
 * 自定义上下文菜单元素的引用。
 */
let contextMenuElement: HTMLElement | null = null;

/**
 * Removes the custom context menu from the DOM.
 * 从 DOM 中移除自定义上下文菜单。
 */
function removeContextMenu(): void {
  if (contextMenuElement) {
    contextMenuElement.remove();
    contextMenuElement = null;
    // Remove the global click listener used to close the menu
    // 移除用于关闭菜单的全局点击监听器
    document.removeEventListener('click', removeContextMenu);
  }
}

/**
 * Shows the custom context menu for a file item.
 * 显示文件项的自定义上下文菜单。
 *
 * @param event - The contextmenu event.
 *              - contextmenu 事件。
 * @param file - The file item that was right-clicked.
 *             - 被右键点击的文件项。
 */
function showFileContextMenu(event: MouseEvent, _file: FileItem): void { // _file indicates it might not be the only relevant item
  removeContextMenu(); 
  event.preventDefault();
  event.stopPropagation();

  // Get all currently selected items
  // 获取所有当前选定的项目
  const selectedPaths = getSelectedFiles();
  const selectedItems = currentRenderedFiles.filter(item => selectedPaths.includes(item.name));
  const numSelected = selectedItems.length;

  if (numSelected === 0) {
    console.warn("Context menu shown with no selected items? This shouldn't happen.");
    return; // Don't show menu if nothing is selected
  }

  console.log(`Context menu requested for ${numSelected} selected item(s). First item: ${selectedItems[0]?.name}`);

  // --- Create Menu Structure ---
  contextMenuElement = document.createElement('div');
  contextMenuElement.id = 'custom-context-menu';
  contextMenuElement.style.position = 'absolute';
  contextMenuElement.style.left = `${event.clientX}px`;
  contextMenuElement.style.top = `${event.clientY}px`;
  contextMenuElement.style.zIndex = '1000';

  const menuList = document.createElement('ul');

  // --- Populate Menu Items --- 
  if (numSelected === 1) {
    // Single item selected / 单个项目选中
    const singleItem = selectedItems[0];
    if (singleItem.is_dir) {
      // Single Folder / 单个文件夹
      menuList.innerHTML = `
        <li data-action="open-folder">打开</li>
        <li data-action="extract">提取到...</li>
        <hr>
        <li data-action="copy-path">复制路径</li>
        <li data-action="properties">属性</li>
      `;
    } else {
      // Single File / 单个文件
      menuList.innerHTML = `
        <li data-action="extract">提取到...</li>
        <hr>
        <li data-action="copy-path">复制路径</li>
        <li data-action="properties">属性</li>
      `;
    }
  } else {
    // Multiple items selected / 多个项目选中
    menuList.innerHTML = `
      <li data-action="extract">提取 ${numSelected} 项到...</li>
      <hr>
      <li data-action="copy-path">复制路径</li>
      <li data-action="properties">属性</li>
    `;
  }

  // --- Add Event Listener for Menu Actions --- 
  menuList.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'LI' && target.dataset.action) {
      const action = target.dataset.action;
      console.log(`Context menu action clicked: ${action}`, selectedPaths);
      removeContextMenu(); // Close menu after clicking an action

      try {
          switch (action) {
            case 'open-folder':
              if (numSelected === 1 && selectedItems[0].is_dir) {
                console.log(`打开文件夹: ${selectedItems[0].name}`);
                // 直接调用导航函数，而不是分发事件
                navigateToFolder(selectedItems[0].name);
                console.log('已调用导航函数');
              } else {
                console.warn("'打开文件夹'操作在非文件夹或多选状态下被调用");
              }
              break;
            case 'extract':
              // Trigger the extraction process using extractionService, passing selected paths
              // 使用 extractionService 触发提取过程，传递选定的路径
              await startExtractionProcess(selectedPaths);
              break;
            case 'copy-path':
              // TODO: Implement copy path functionality
              // TODO: 实现复制路径功能
              const pathsToCopy = selectedPaths.join('\n'); // Join multiple paths with newline
              // await navigator.clipboard.writeText(pathsToCopy);
              showInfo('复制路径功能待实现 (Copy Path TBD)');
              console.log('Paths to copy:', pathsToCopy);
              break;
            case 'properties':
              // TODO: Implement properties dialog/panel
              // TODO: 实现属性对话框/面板
              showInfo('属性功能待实现 (Properties TBD)');
              console.log('Items for properties:', selectedItems);
              break;
            default:
              console.warn(`Unhandled context menu action: ${action}`);
          }
      } catch (err) {
          console.error(`Error executing context menu action '${action}':`, err);
          showError(`执行操作失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // Prevent clicks inside the menu from closing it immediately
  // (Already handled by stopping propagation on the main menu element)
  // contextMenuElement.addEventListener('click', (e) => e.stopPropagation());

  contextMenuElement.appendChild(menuList);
  document.body.appendChild(contextMenuElement);

  // Add a global listener to close the menu when clicking outside
  setTimeout(() => document.addEventListener('click', removeContextMenu), 0);
}

/**
 * Updates the file list UI with the provided files.
 * Renders files in batches for better performance with large lists.
 * 
 * 使用提供的文件更新文件列表UI。
 * 为提高大型列表的性能，分批渲染文件。
 * 
 * @param files - List of files to display.
 *              - 要显示的文件列表。
 * @param currentFolder - Current folder path for display name calculation.
 *                      - 用于计算显示名称的当前文件夹路径。
 * @param onFileClick - Optional callback for file click events.
 *                    - 文件单击事件的可选回调。
 * @param onFileDblClick - Optional callback for file double-click events.
 *                       - 文件双击事件的可选回调。
 */
export function updateFileList(
  files: FileItem[],
  currentFolder: string,
  onFileClick?: FileClickHandler,
  onFileDblClick?: FileDblClickHandler
): void {
  console.log(`updateFileList: Starting to render ${files.length} file items`);
  currentRenderedFiles = files; // Cache the files being rendered
  selectedFiles.clear(); // Clear selection when the list updates
  lastClickedIndex = -1; // Reset last clicked index
  // Save references to callback functions for event handlers
  currentOnFileClick = onFileClick;
  currentOnFileDblClick = onFileDblClick;

  const fileListBody = document.querySelector<HTMLElement>('.file-list-body');
  if (!fileListBody) {
    console.error('Could not find file list container element .file-list-body');
    return;
  }

  // Remove and re-attach listeners to ensure they use the latest callback references
  // This prevents issues if updateFileList is called multiple times with different callbacks
  fileListBody.removeEventListener('click', handleFileListClick);
  fileListBody.removeEventListener('dblclick', handleFileListDblClick);
  fileListBody.removeEventListener('contextmenu', handleFileListContextMenu); // Remove previous listener if any

  fileListBody.addEventListener('click', handleFileListClick);
  fileListBody.addEventListener('dblclick', handleFileListDblClick);
  fileListBody.addEventListener('contextmenu', handleFileListContextMenu);

  const BATCH_SIZE = 100; // Number of items to render per batch
  const RENDER_DELAY = 10; // Delay in ms between batches

  // Apply fade-out effect before clearing content
  fileListBody.classList.add('fade-out');

  fileListBody.innerHTML = ''; // Clear previous content

  // Handle empty folder case
  if (files.length === 0) {
    console.log('No files to display, showing empty folder message');
    fileListBody.innerHTML = '<div class="empty-folder">This folder is empty</div>';
    fileListBody.classList.remove('fade-out'); // Remove fade immediately
    return;
  }

  /**
   * Renders a batch of file items.
   * 渲染一批文件项。
   * 
   * @param startIndex - The starting index for the current batch.
   *                   - 当前批次的起始索引。
   */
  function renderBatch(startIndex: number) {
    // No need to re-check fileListBody here, as the function returns early if it was null to begin with.
    // TypeScript might still warn, but it's logically safe.
    console.log(`renderBatch: Rendering batch starting at ${startIndex}`);
    const endIndex = Math.min(startIndex + BATCH_SIZE, files.length);
    const batchFragment = document.createDocumentFragment(); // Use fragment for efficiency

    // Create and append elements for the current batch
    for (let i = startIndex; i < endIndex; i++) {
      const file = files[i];
      appendFileItem(batchFragment, file, currentFolder, i);
    }
    // Append the batch fragment to the DOM
    fileListBody?.appendChild(batchFragment); // Use optional chaining

    // Schedule the next batch if there are more files
    if (endIndex < files.length) {
      console.log(`renderBatch: ${files.length - endIndex} items remaining to render`);
      setTimeout(() => {
        renderBatch(endIndex);
      }, RENDER_DELAY);
    } else {
      // All batches rendered, apply fade-in effect
      console.log('renderBatch: All batches rendered');
      if (fileListBody) {
          fileListBody.classList.remove('fade-out');
          fileListBody.classList.add('fade-in');
      }

      // Remove fade-in class after animation completes
      setTimeout(() => {
        fileListBody?.classList.remove('fade-in'); // Use optional chaining
      }, 300); // Match animation duration
    }
  }

  console.log('Starting batch rendering of file list');
  renderBatch(0); // Start rendering the first batch
}

/**
 * Handles click events on the file list body (event delegation).
 * Manages single selection, Ctrl/Meta + click for multi-selection, and Shift + click for range selection.
 * 
 * 处理文件列表主体上的点击事件（事件委托）。
 * 管理单击选择、Ctrl/Meta + 单击多选以及 Shift + 单击范围选择。
 * 
 * @param event - The mouse click event.
 *              - 鼠标点击事件。
 */
function handleFileListClick(event: MouseEvent): void {
  removeContextMenu(); // Close context menu on regular click / 常规点击时关闭上下文菜单
  if (isLoading) return; // Prevent clicks while loading

  const target = event.target as HTMLElement;
  // Find the closest ancestor with the 'file-item' class
  const fileItemElement = target.closest<HTMLElement>('.file-item');

  if (fileItemElement) {
    // Clicked on a file item
    const filePath = fileItemElement.dataset.filename; // Get file path from data attribute
    const fileIndex = parseInt(fileItemElement.dataset.index || '-1', 10); // Get index

    if (!filePath || fileIndex === -1) return; // Exit if data attributes are missing

    const file = currentRenderedFiles[fileIndex]; // Get the file object from cache
    if (!file) return; // Exit if file not found in cache

    const ctrlPressed = event.ctrlKey || event.metaKey; // Check Ctrl (Windows/Linux) or Meta (Mac)
    const shiftPressed = event.shiftKey;

    // --- Selection Logic --- 
    if (shiftPressed && lastClickedIndex !== -1) {
      // Shift + Click: Select range
      const start = Math.min(lastClickedIndex, fileIndex);
      const end = Math.max(lastClickedIndex, fileIndex);
      if (!ctrlPressed) {
          // If Ctrl is not pressed, clear previous selection before selecting range
          selectedFiles.clear(); 
      }
      // Add all items within the range to selection
      for (let i = start; i <= end; i++) {
        selectedFiles.add(currentRenderedFiles[i].name);
      }
    } else if (ctrlPressed) {
      // Ctrl/Meta + Click: Toggle selection
      if (selectedFiles.has(filePath)) {
        selectedFiles.delete(filePath); // Deselect if already selected
      } else {
        selectedFiles.add(filePath); // Select if not selected
      }
      lastClickedIndex = fileIndex; // Update last clicked for potential shift-click later
    } else {
      // Simple Click: Select only this item
      selectedFiles.clear();
      selectedFiles.add(filePath);
      lastClickedIndex = fileIndex; // Update last clicked index
    }

    updateSelectionVisuals(); // Update UI to reflect new selection

    // Call the external onFileClick callback if provided
    if (currentOnFileClick) {
        currentOnFileClick(file, event);
    }

  } else {
    // Clicked on empty space within the file list body
    selectedFiles.clear(); // Clear selection
    lastClickedIndex = -1; // Reset last clicked index
    updateSelectionVisuals(); // Update UI
  }
}

/**
 * Handles double-click events on the file list body (event delegation).
 * Triggers navigation into folders or file preview attempts.
 * 
 * 处理文件列表主体上的双击事件（事件委托）。
 * 触发进入文件夹或尝试文件预览的操作。
 * 
 * @param event - The mouse double-click event.
 *              - 鼠标双击事件。
 */
function handleFileListDblClick(event: MouseEvent): void {
  removeContextMenu(); // Close context menu on double click / 双击时关闭上下文菜单
  if (isLoading) return; // Prevent double-clicks while loading

  const target = event.target as HTMLElement;
  // Find the closest ancestor with the 'file-item' class
  const fileItemElement = target.closest<HTMLElement>('.file-item');

  if (fileItemElement) {
    // Double-clicked on a file item
    const fileIndex = parseInt(fileItemElement.dataset.index || '-1', 10); // Get index
    if (fileIndex === -1) return; // Exit if index is missing

    const file = currentRenderedFiles[fileIndex]; // Get the file object
    if (!file) return; // Exit if file not found

    // Clear selection on double-click before navigating/previewing
    selectedFiles.clear();
    lastClickedIndex = -1;
    updateSelectionVisuals();

    let defaultBehaviorPrevented = false;
    // Call the external onFileDblClick callback if provided
    if (currentOnFileDblClick) {
        // NOTE: The callback could potentially return a boolean 
        // to indicate if default behavior should be prevented, 
        // but this is not implemented currently.
        currentOnFileDblClick(file);
    }

    // Execute default double-click behavior if the callback didn't prevent it
    if (!defaultBehaviorPrevented) {
        if (file.is_dir) {
          // 如果是文件夹，直接调用导航函数
          console.log(`双击导航触发: ${file.name}`);
          navigateToFolder(file.name);
          console.log('已调用导航函数');
        } else {
          // If it's a file, show info (preview not implemented)
          showInfo(`预览功能尚未实现: ${getDisplayName(file, '')}`);
        }
    }
  }
}

/**
 * Handles contextmenu events on the file list body (event delegation).
 * Determines the target file item and shows the custom context menu.
 *
 * 处理文件列表主体上的 contextmenu 事件（事件委托）。
 * 确定目标文件项并显示自定义上下文菜单。
 *
 * @param event - The contextmenu mouse event.
 *              - contextmenu 鼠标事件。
 */
function handleFileListContextMenu(event: MouseEvent): void {
  if (isLoading) return; // Prevent context menu while loading

  const target = event.target as HTMLElement;
  // Find the closest ancestor with the 'file-item' class
  const fileItemElement = target.closest<HTMLElement>('.file-item');

  if (fileItemElement) {
    // Right-clicked on a file item
    const filePath = fileItemElement.dataset.filename;
    const fileIndex = parseInt(fileItemElement.dataset.index || '-1', 10);

    if (filePath && fileIndex !== -1) {
      const file = currentRenderedFiles[fileIndex];
      if (file) {
        // TODO: Handle selection properly. If the clicked item is not selected,
        // maybe select it exclusively before showing the menu? Or handle multi-selection context menus.
        // TODO: 正确处理选择。如果点击的项目未被选中，
        // 是否应该在显示菜单前单独选中它？或者处理多选上下文菜单。

        // If the right-clicked item is not part of the current selection,
        // clear the selection and select only this item.
        // 如果右键点击的项目不在当前选择中，
        // 清除选择并仅选中此项目。
        if (!selectedFiles.has(filePath)) {
          selectedFiles.clear();
          selectedFiles.add(filePath);
          updateSelectionVisuals();
        }

        showFileContextMenu(event, file);
        return; // Stop further processing
      }
    }
  }

  // If the click was not on a file item (e.g., empty space), remove any existing menu
  // 如果点击的不是文件项（例如空白区域），则移除任何现有的菜单
  removeContextMenu();
}

/**
 * Updates the visual appearance of file items based on the current selection state.
 * Adds/removes the 'selected' class to file item elements.
 * 
 * 根据当前选择状态更新文件项的视觉外观。
 * 添加/移除文件项元素的 'selected' 类。
 */
function updateSelectionVisuals(): void {
  // Select all file item elements currently in the DOM
  const fileItemElements = document.querySelectorAll<HTMLElement>('.file-item');

  fileItemElements.forEach(item => {
    const filename = item.dataset.filename; // Get the filename from data attribute
    if (filename && selectedFiles.has(filename)) {
      // If the file is in the selected set, add the 'selected' class
      item.classList.add('selected');
    } else {
      // Otherwise, remove the 'selected' class
      item.classList.remove('selected');
    }
  });
}

/**
 * Creates and appends a single file item element to a container (DocumentFragment or HTMLElement).
 * 为单个文件创建DOM元素并将其附加到容器（DocumentFragment或HTMLElement）。
 * 
 * @param container - The container (DocumentFragment or HTMLElement) to append the element to.
 *                  - 要附加元素到的容器（DocumentFragment或HTMLElement）。
 * @param file - The file data object.
 *             - 文件数据对象。
 * @param currentFolder - The path of the current folder (used for display name calculation).
 *                      - 当前文件夹的路径（用于显示名称计算）。
 * @param index - The index of the file in the `currentRenderedFiles` array.
 *              - 文件在 `currentRenderedFiles` 数组中的索引。
 */
function appendFileItem(
  container: DocumentFragment | HTMLElement,
  file: FileItem,
  currentFolder: string,
  index: number
): void {
  // Get display name and icon based on file type and path
  const displayName = getDisplayName(file, currentFolder);
  const fileIcon = getFileIcon(file);
  
  // Create the main div element for the file item
  const itemElement = document.createElement('div');
  itemElement.className = 'file-item'; // Assign base class
  // Store filename and index in data attributes for event handlers
  itemElement.dataset.filename = file.name; 
  itemElement.dataset.index = index.toString(); 
  
  // Set the inner HTML structure for the file item columns using the specific classes
  itemElement.innerHTML = `
    <div class="file-column col-icon">${fileIcon}</div>
    <div class="file-column col-name" title="${displayName}">${displayName}</div>
    <div class="file-column col-date">${formatDate(file.modified_date)}</div>
    <div class="file-column col-type">${file.type_name || (file.is_dir ? 'Folder' : 'File')}</div>
    <div class="file-column col-size">${file.is_dir ? '' : formatFileSize(file.size)}</div>
  `;
  
  // Append the created element to the provided container
  container.appendChild(itemElement);
}

/**
 * Sets the loading state visual indicator for the file list body.
 * 设置文件列表主体的加载状态视觉指示器。
 * 
 * @param loading - Whether the file list is currently loading.
 *                - 文件列表当前是否正在加载。
 */
export function setLoading(loading: boolean): void {
  isLoading = loading; // Update internal loading state
  
  const fileListBody = document.querySelector<HTMLElement>('.file-list-body');
  if (fileListBody) {
    if (loading) {
      // Add 'loading' class to potentially show a spinner or overlay via CSS
      fileListBody.classList.add('disabled-interaction'); // Use class to disable interaction
    } else {
      // Remove 'loading' class
      fileListBody.classList.remove('disabled-interaction');
    }
  }
}

/**
 * Shows the file browser UI and hides the home page UI.
 * Also ensures the toolbar is visible.
 * Uses CSS transitions for a smoother visual effect.
 * 
 * 显示文件浏览器UI并隐藏主页UI。
 * 同时确保工具栏可见。
 * 使用CSS过渡以获得更平滑的视觉效果。
 */
export function showFileBrowser(): void {
  console.log('Showing file browser view');
  
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector<HTMLElement>('.toolbar'); // Get toolbar element
  
  if (homePage && fileBrowser && toolbar) {
    // Start fade-out transition for home page
    homePage.style.opacity = '0';
    
    // After fade-out transition completes, hide home page and show file browser
    setTimeout(() => {
      homePage.style.display = 'none'; // Hide home page
      fileBrowser.style.display = 'flex'; // Show file browser (use flex as per layout)
      toolbar.classList.remove('toolbar-hidden'); // Make sure toolbar is visible
      
      // Use requestAnimationFrame for smoother fade-in start
      requestAnimationFrame(() => {
          fileBrowser.style.opacity = '1'; // Start fade-in transition for file browser
          toolbar.style.opacity = '1'; // Fade in toolbar as well
      });
    }, 200); // Match CSS transition duration
  } else {
    console.error('Could not find home-page, file-browser, or toolbar elements');
  }
}

/**
 * Shows the home page UI and hides the file browser UI.
 * Also hides the toolbar.
 * Uses CSS transitions for a smoother visual effect.
 * 
 * 显示主页UI并隐藏文件浏览器UI。
 * 同时隐藏工具栏。
 * 使用CSS过渡以获得更平滑的视觉效果。
 */
export function showHomePage(): void {
  console.log('Showing home page view');
  
  const homePage = document.getElementById('home-page');
  const fileBrowser = document.getElementById('file-browser');
  const toolbar = document.querySelector<HTMLElement>('.toolbar'); // Get toolbar element

  if (homePage && fileBrowser && toolbar) {
    // Start fade-out transition for file browser and toolbar
    fileBrowser.style.opacity = '0';
    toolbar.style.opacity = '0';
    
    // After fade-out transition completes, hide file browser and show home page
    setTimeout(() => {
      fileBrowser.style.display = 'none'; // Hide file browser
      toolbar.classList.add('toolbar-hidden'); // Hide toolbar using class
      homePage.style.display = 'flex'; // Show home page (use flex as per layout)
      
      // Use requestAnimationFrame for smoother fade-in start
      requestAnimationFrame(() => {
        homePage.style.opacity = '1'; // Start fade-in transition for home page
      });
    }, 200); // Match CSS transition duration
  } else {
    console.error('Could not find home-page, file-browser, or toolbar elements');
  }
}

/**
 * Updates the path navigation bar (breadcrumbs) based on the current folder.
 * 根据当前文件夹更新路径导航栏（面包屑）。
 * 
 * @param currentFolder - The current folder path (e.g., "folder1/subfolder").
 *                      - 当前文件夹路径（例如，"folder1/subfolder"）。
 * @param archiveName - The display name of the opened archive file.
 *                    - 打开的压缩包文件的显示名称。
 * @param onFolderClick - Callback function executed when a path segment (folder) is clicked.
 *                      - 单击路径段（文件夹）时执行的回调函数。
 */
export function updatePathNavigation(
  currentFolder: string,
  archiveName: string | null | undefined, // Allow null/undefined archive name
  onFolderClick: (path: string) => void
): void {
  const navPathContainer = document.querySelector<HTMLElement>('.nav-path');
  const pathContainer = document.querySelector<HTMLElement>('.path-container'); // Get the parent container
  
  if (!navPathContainer || !pathContainer) {
    console.error('Could not find .nav-path or .path-container element');
    return;
  }
  
  // Clear existing path items before rebuilding
  navPathContainer.innerHTML = '';

  // If no archive is open, hide the path container or show placeholder
  if (!archiveName) {
    // Option 1: Hide the path container entirely
    // pathContainer.style.display = 'none'; 
    
    // Option 2: Show a placeholder text (adjust as needed)
    const placeholder = document.createElement('span');
    placeholder.className = 'path-placeholder';
    placeholder.textContent = ' '; // Or 'No archive open'
    placeholder.style.color = 'var(--text-disabled-color)';
    navPathContainer.appendChild(placeholder);
    return;
  }
  
  // If archive is open, ensure path container is visible
  // pathContainer.style.display = 'flex'; // Or block, depending on default style

  // --- Create Archive Root Item --- 
  const archiveItem = document.createElement('span');
  archiveItem.className = 'path-item path-archive'; // Specific class for archive root
  // Add archive icon and name
  archiveItem.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8v13H3V8"></path>
      <path d="M1 3h22v5H1z"></path>
      <path d="M10 12h4"></path>
    </svg>
    <span>${archiveName}</span>
  `;
  // Add click listener to navigate to the root (" ")
  archiveItem.addEventListener('click', () => onFolderClick(''));
  navPathContainer.appendChild(archiveItem);
  
  // --- Create Path Segment Items --- 
  // If we're at the root, no further segments are needed
  if (!currentFolder) return;
  
  // Split the folder path into segments, filtering out empty strings (e.g., from trailing slashes)
  const segments = currentFolder.split('/').filter(s => s);
  let currentPath = ''; // To build the cumulative path for each segment's click handler
  
  segments.forEach((segment) => {
    // Add path separator before each segment (except the first, handled by archive item)
    const separator = document.createElement('span');
    separator.className = 'path-separator';
    separator.textContent = '>'; // Use '>' as separator
    navPathContainer.appendChild(separator);
    
    // Append the current segment and a slash to the cumulative path
    currentPath += segment + '/';
    
    // Create the clickable element for the folder segment
    const folderItem = document.createElement('span');
    folderItem.className = 'path-item';
    folderItem.textContent = segment; // Display the folder name
    // Add click listener to navigate to this segment's cumulative path
    // Use a closure to capture the correct 'currentPath' value for each listener
    folderItem.addEventListener('click', () => onFolderClick(currentPath)); 
    navPathContainer.appendChild(folderItem);
  });
}

/**
 * Returns an array containing the full paths of the currently selected files/folders.
 * 返回包含当前选定文件/文件夹完整路径的数组。
 * 
 * @returns An array of selected file/folder paths.
 *          一个包含选定文件/文件夹路径的数组。
 */
export function getSelectedFiles(): string[] {
  // Convert the Set of selected paths to an array
  return Array.from(selectedFiles);
} 