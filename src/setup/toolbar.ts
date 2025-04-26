/**
 * Toolbar Setup Module - Configures the application toolbar buttons
 * 工具栏设置模块 - 配置应用程序工具栏按钮
 */
import { showError, showInfo } from '../ui/notification';
import { getSelectedFiles } from '../ui/fileExplorer';

/**
 * Interface for dependencies needed by toolbar setup
 * 工具栏设置所需的依赖项接口
 */
export interface ToolbarDependencies {
  getArchivePath: () => string;
  openArchiveDialog: () => Promise<void>;
  startExtraction: () => Promise<void>;
}

/**
 * Sets up event handlers for toolbar buttons
 * 为工具栏按钮设置事件处理程序
 * 
 * @param deps - Dependencies needed for toolbar actions
 *             - 工具栏操作所需的依赖项
 */
export function setupToolbarButtons(deps: ToolbarDependencies): void {
  const toolButtons = document.querySelectorAll('.tool-btn');
  
  // Setup specific buttons first (Extract)
  const extractButton = document.getElementById('extract-button');

  if (extractButton) {
    extractButton.addEventListener('click', () => {
      console.log("工具按钮 提取文件 被点击 (特定ID)");
      const archivePath = deps.getArchivePath();
      if (!archivePath) {
        console.warn("解压按钮点击：没有打开的压缩包");
        showError('请先打开一个压缩包再进行解压。');
        return;
      }
      deps.startExtraction();
    });
  } else {
    console.warn("Toolbar button with ID 'extract-button' not found.");
  }

  // Setup generic handlers for other tool buttons
  toolButtons.forEach(button => {
    // Skip buttons that have specific handlers above
    if (button.id === 'extract-button') {
      return; 
    }

    button.addEventListener('click', () => {
      const title = button.getAttribute('title');
      console.log(`工具按钮 ${title} 被点击 (通用处理)`);
      
      const archivePath = deps.getArchivePath();
      if (!archivePath) {
        showError('请先打开一个压缩包');
        return;
      }
      
      // Handle different button actions
      switch(title) {
        case '添加文件':
          if (!archivePath) {
            deps.openArchiveDialog();
          } else {
            // Logic to add files (implement later)
            showError('该功能正在开发中...');
          }
          break;
        case '剪切':
        case '复制':
        case '粘贴':
        case '重命名':
        case '移动':
          showError('该功能正在开发中...');
          break;
        case '删除':
          handleDelete(deps);
          break;
        case '新建文件夹':
        case '属性':
          showError('该功能正在开发中...');
          break;
        default:
          console.warn(`Unhandled tool button: ${title}`);
      }
    });
  });

  // Initial state update (disable extract button)
  updateToolbarButtonsState(false);
}

/**
 * Placeholder handler for the delete action.
 * 删除操作的占位符处理程序。
 * 
 * @param _deps - Toolbar dependencies.
 *              - 工具栏依赖项。
 */
function handleDelete(_deps: ToolbarDependencies): void {
  const filesToDelete = getSelectedFiles();
  if (filesToDelete.length === 0) {
    showInfo("请先选择要删除的文件或文件夹。");
    return;
  }

  console.log("Attempting to delete files (not implemented):", filesToDelete);
  // TODO: Implement actual deletion logic by calling a backend function.
  // Example: await invoke('delete_files_in_archive', { archivePath: deps.getArchivePath(), files: filesToDelete });
  // Then refresh the UI: refreshUI(); (need to import refreshUI from main)

  showInfo(`删除功能正在开发中。选中的 ${filesToDelete.length} 个项目未被删除。`);
}

/**
 * Updates toolbar button states based on application state
 * 根据应用程序状态更新工具栏按钮状态
 * 
 * @param archiveLoaded - Whether an archive is currently loaded
 *                      - 当前是否已加载压缩包
 */
export function updateToolbarButtonsState(archiveLoaded: boolean) {
  const extractButton = document.getElementById('extract-button') as HTMLButtonElement | null;

  if (extractButton) {
    if (archiveLoaded) {
      extractButton.removeAttribute('disabled');
    } else {
      extractButton.setAttribute('disabled', 'true');
    }
  }
} 