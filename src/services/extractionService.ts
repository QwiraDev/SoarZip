import {
  selectDestinationFolder as invokeSelectDestinationFolder,
  extractFiles as invokeExtractFiles,
} from "./fileService";
import { getDefaultExtractPath } from "./windowService";
import { getSelectedFiles } from "../ui/fileExplorer"; // Assuming fileExplorer exports this
import { showExtractDialog } from "../ui/extractDialog"; // Assuming extractDialog exports this
import { showError, showSuccess } from "../ui/notification";
import {
  getCurrentArchivePath,
  setIsLoading,
} from "./appState";
// Need a way to update loading status message, e.g., via uiManager
// import { updateLoadingStatus } from '../ui/uiManager';

/**
 * Starts the extraction process by showing the extract dialog.
 * 通过显示解压对话框启动解压流程。
 *
 * Checks if an archive is open and retrieves selected files for extraction.
 * 检查是否有打开的压缩包，并获取要解压的已选文件。
 */
export async function startExtractionProcess(filesToExtractOverride?: string[]) {
  console.log("Starting extraction process...");
  const currentArchivePath = getCurrentArchivePath();
  if (!currentArchivePath) {
    showError("没有打开的压缩包，无法解压。");
    return;
  }

  // Use override if provided, otherwise get current selection
  // 如果提供了覆盖值则使用它，否则获取当前选择
  const filesToExtract = filesToExtractOverride ?? getSelectedFiles();
  const numSelected = filesToExtract.length;
  console.log(`Selected files/folders (${numSelected}):`, filesToExtract);

  const defaultPath = getDefaultExtractPath(currentArchivePath);

  showExtractDialog(
    defaultPath,
    async () => {
      console.log("Change path triggered...");
      try {
        const selected = await invokeSelectDestinationFolder();
        console.log("New path selection result:", selected);
        return selected;
      } catch (error) {
        console.error("Error selecting destination folder:", error);
        showError(`选择文件夹失败: ${error}`);
        return null;
      }
    },
    (confirmedPath: string) => {
      console.log(`Extraction confirmed to: ${confirmedPath}`);
      performExtraction(confirmedPath, filesToExtract);
    },
    () => {
      console.log("Extraction operation cancelled.");
    }
  );
}

/**
 * Performs the actual extraction operation.
 * 执行实际的解压操作。
 *
 * Handles loading state, backend extraction call, and success/error notifications.
 * 处理加载状态、后端解压调用以及成功/错误通知。
 *
 * @param destination - The destination folder path
 *                    - 目标文件夹路径
 * @param filesToExtract - Array of file paths to extract
 *                       - 要解压的文件路径数组
 */
async function performExtraction(destination: string, filesToExtract: string[]) {
  const currentArchivePath = getCurrentArchivePath();

  try {
    setIsLoading(true); // Update loading status via uiManager
    // updateLoadingStatus(true, loadingMessage);
    console.log(`Starting backend extraction: archive=${currentArchivePath}, files=${filesToExtract.length}, dest=${destination}`);

    await invokeExtractFiles(currentArchivePath, filesToExtract, destination);

    console.log("Backend extraction command completed");
    showSuccess(`文件已成功解压到: ${destination}`);

  } catch (error) {
    console.error("Error during extraction:", error);
    showError(`解压失败: ${error}`);
  } finally {
    setIsLoading(false); // Update loading status via uiManager
    // updateLoadingStatus(false);
  }
} 