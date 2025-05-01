// Core services
import { initializeTheme } from "./services/themeService";
import { invoke } from "@tauri-apps/api/core";

// Setup modules
import { loadAllComponents } from "./setup/componentLoader";
import { 
  setupApplicationEventListeners, 
  loadArchive // Needed for initial load check
} from "./setup/appSetup";
import { updateToolbarButtonsState } from "./setup/toolbar"; 

// UI interaction modules
import { showHomePage, updateStatusBar } from "./ui/uiManager"; 
import { showError } from "./ui/notification"; 

// Import main stylesheet
import "./styles/main.css";

/**
 * Initialize the application.
 * 初始化应用程序。
 * 
 * Loads components, sets up theme, event listeners, and handles initial archive loading.
 * 加载组件、设置主题、事件监听器，并处理初始压缩包加载。
 */
async function initializeApp() {
  console.log("Initializing application...");

  // 1. Load HTML UI component structures
  loadAllComponents();

  // 2. Initialize base services like theme
  initializeTheme();

  // 3. Setup all event listeners and connections between components/services
  setupApplicationEventListeners();

  // 4. Handle initial state (check for CLI arg, show home or load archive)
  try {
    console.log("Checking for initial file path from CLI...");
    const initialPath = await invoke<string | null>('get_initial_file_path');
    if (initialPath) {
      console.log(`Initial file path received: ${initialPath}. Loading archive...`);
      await loadArchive(initialPath);
      // loadArchive calls showFileBrowser internally now, which makes content visible.
    } else {
      console.log("No initial file path found. Showing home page.");
      showHomePage(); // Show home page via uiManager
      updateToolbarButtonsState(false); 
      updateStatusBar(); 
    }
  } catch (err) {
    console.error("Error checking for initial file path:", err);
    showError(`检查启动参数失败: ${err}`); 
    showHomePage(); // Fallback to home page
    updateToolbarButtonsState(false); 
    updateStatusBar(); 
  } finally {
    // Remove initializing class regardless of outcome
    document.body.classList.remove('initializing');
    console.log("Initialization sequence finished, removing initializing class.");
  }

  // Note: The final removal of the initializing class is now in the finally block
  // console.log("Application initialized."); // Log moved or adapted
}

// Initialize app when DOM is fully loaded
window.addEventListener("DOMContentLoaded", initializeApp);
