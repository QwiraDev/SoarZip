import { setupWindowControls } from './windowControls';
import { setupMenuItems } from './menu';
import { setupHomeActions } from './home';
import { setupNavButtons } from './navigation';
import { setupToolbarButtons } from './toolbar';
import { setupSearch } from './search';
import { setupLogoClick } from './logo';
import { setupSettingsButton } from './settings';

// Import necessary functions/services used by setup functions
import { openArchiveDialogAndLoad, loadArchive } from '../services/archiveService'; // Assuming archiveService exports these
import { startExtractionProcess } from '../services/extractionService'; // Assuming extractionService exports this
import { 
    performSearch, 
    refreshUI, 
    navigateToFolder, 
    resetAppToHome,
    updateLoadingStatus
} from '../ui/uiManager'; // Assuming uiManager exports these
import { 
    getIsLoading, 
    getCurrentArchivePath, 
    setCurrentFiles
} from '../services/appState'; // State needed by setups
import {
    navigationHistory, 
    // updateNavButtonsState // uiManager handles this 
} from '../services/navigationService'; // Navigation state needed

/**
 * Initializes all UI component event listeners and setups.
 * 初始化所有UI组件的事件监听器和设置。
 */
export function setupApplicationEventListeners() {
  console.log("Setting up application event listeners and component interactions...");

  // Pass necessary functions and state getters to the setup modules
  setupWindowControls();
  setupMenuItems({ openArchiveDialog: openArchiveDialogAndLoad });
  setupSearch({ performSearch }); // Pass the uiManager search function
  setupNavButtons({
      isLoading: getIsLoading,
      canGoBack: () => navigationHistory.canGoBack(),
      getPreviousPath: () => navigationHistory.getPreviousPath(),
      canGoForward: () => navigationHistory.canGoForward(),
      getNextPath: () => navigationHistory.getNextPath(),
      getCurrentPath: () => navigationHistory.getCurrentPath(),
      getParentPath: (path) => navigationHistory.getParentPath(path),
      refreshUI: refreshUI, // Pass the uiManager refresh function
      navigateToFolder: navigateToFolder, // Pass the uiManager navigation function
      getArchivePath: getCurrentArchivePath,
      updateLoadingStatus: updateLoadingStatus, // Pass the imported function
      setCurrentFiles: setCurrentFiles
  });
  setupToolbarButtons({ 
      getArchivePath: getCurrentArchivePath, 
      openArchiveDialog: openArchiveDialogAndLoad, 
      startExtraction: startExtractionProcess 
  });
  setupHomeActions({ openArchiveDialog: openArchiveDialogAndLoad });
  setupLogoClick({ 
      getArchivePath: getCurrentArchivePath, 
      resetApp: resetAppToHome // Use the uiManager reset function
  });
  setupSettingsButton({});

  console.log("Application event listeners and component interactions set up.");
}

// Export loadArchive for initial load check
export { loadArchive }; 