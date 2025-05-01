import {
  openArchive as invokeOpenArchive,
  selectArchiveFile as invokeSelectArchiveFile,
} from "./fileService";
import { setWindowTitle, getFileNameFromPath } from "./windowService";
import {
  refreshUI,
} from "../ui/uiManager";
import { updateToolbarButtonsState } from "../setup/toolbar";
import { showHomePage } from "../ui/uiManager";
import { showFileBrowser } from "../ui/fileExplorer";
import {
  setCurrentArchivePath,
  setCurrentFiles,
  resetAppState,
  setIsLoading,
} from "./appState";
import { navigationHistory } from "./navigationService";
import { showError, showSuccess } from "../ui/notification";


/**
 * Opens a file dialog for selecting an archive file and loads it upon selection.
 * 打开文件对话框以选择压缩包文件，并在选择后加载它。
 */
export async function openArchiveDialogAndLoad() {
  try {
    console.log("Opening archive dialog...");
    const selected = await invokeSelectArchiveFile();

    if (selected) {
      console.log(`Archive selected: ${selected}`);
      await loadArchive(selected);
    } else {
      console.log("Archive selection cancelled.");
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    showError(`打开文件对话框失败: ${error}`);
  }
}

/**
 * Loads an archive file and updates the application state and UI.
 * 加载压缩包文件并更新应用程序状态和UI。
 *
 * @param archivePath - Path to the archive file to be loaded.
 *                    - 要加载的压缩包文件路径。
 */
export async function loadArchive(archivePath: string) {
  try {
    setIsLoading(true);
    console.log(`Starting to open archive: ${archivePath}`);
    const files = await invokeOpenArchive(archivePath);
    console.log(`Successfully retrieved file list with ${files.length} items`);

    setCurrentArchivePath(archivePath);
    setCurrentFiles(files);

    navigationHistory.reset("");
    showFileBrowser();

    const archiveFileName = getFileNameFromPath(archivePath);
    console.log(`[archiveService] Attempting to set window title to: "${archiveFileName}"`);
    await setWindowTitle(archiveFileName);
    console.log(`[archiveService] setWindowTitle invoked for: "${archiveFileName}"`);

    console.log("Refreshing UI...");
    refreshUI();
    console.log("UI refresh complete");

    showSuccess(`成功打开压缩包: ${getFileNameFromPath(archivePath)}`);
    updateToolbarButtonsState(true);

  } catch (error) {
    console.error('Failed to open archive:', error);
    showError(`打开压缩包失败: ${error}`);
    resetAppState();
    showHomePage();
    updateToolbarButtonsState(false);
  } finally {
    setIsLoading(false);
  }
} 