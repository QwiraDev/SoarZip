import { showError } from '../ui/notification';

export interface ToolbarDependencies {
  getArchivePath: () => string;
  openArchiveDialog: () => Promise<void>;
}

export function setupToolbarButtons(deps: ToolbarDependencies): void {
  const toolButtons = document.querySelectorAll('.tool-btn');
  
  toolButtons.forEach(button => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('title');
      console.log(`工具按钮 ${title} 被点击`);
      
      const archivePath = deps.getArchivePath();
      if (!archivePath && title !== '添加文件') {
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
        case '提取文件':
        case '剪切':
        case '复制':
        case '粘贴':
        case '重命名':
        case '移动':
        case '删除':
        case '新建文件夹':
        case '属性':
          // All unimplemented features show the same error message
          showError('该功能正在开发中...');
          break;
        default:
          console.warn(`Unhandled tool button: ${title}`);
      }
    });
  });
} 