import { showError } from '../ui/notification';

export interface ToolbarDependencies {
  getArchivePath: () => string;
  openArchiveDialog: () => Promise<void>;
  startExtraction: () => Promise<void>;
}

export function setupToolbarButtons(deps: ToolbarDependencies): void {
  const toolButtons = document.querySelectorAll('.tool-btn');
  
  // Setup specific buttons first (Open, Extract)
  const openButton = document.getElementById('open-button');
  const extractButton = document.getElementById('extract-button');

  if (openButton) {
    openButton.addEventListener('click', () => {
      console.log("工具按钮 打开 被点击 (特定ID)");
      deps.openArchiveDialog();
    });
  } else {
    console.warn("Toolbar button with ID 'open-button' not found.");
  }

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
    if (button.id === 'open-button' || button.id === 'extract-button') {
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
        case '删除':
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