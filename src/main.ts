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
import { setupWindowControls } from "./setup/windowControls"; 

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
  document.body.classList.add('initializing'); // Ensure initializing class is added at the start

  // 1. Load HTML UI component structures
  loadAllComponents();

  // --- Add Titlebar/Window Controls Setup Early ---
  // Initialize custom titlebar controls early
  setupWindowControls(); 

  // 2. Initialize base services like theme
  initializeTheme();

  // 3. Setup all event listeners and connections between components/services
  setupApplicationEventListeners();

  let isLoadingInitialFile = false; // Flag to track if loading from CLI arg

  // 4. Handle initial state (check for CLI arg, show home or load archive)
  try {
    console.log("Checking for initial file path from CLI...");
    const initialPath = await invoke<string | null>('get_initial_file_path');
    if (initialPath) {
      console.log(`Initial file path received: ${initialPath}. Preparing to load...`);
      isLoadingInitialFile = true;
      document.body.classList.add('loading-initial-file'); // Add class to hide home screen via CSS
      await loadArchive(initialPath);
      // loadArchive calls showFileBrowser internally now, which makes content visible.
    } else {
      console.log("No initial file path found. Showing home page.");
      showHomePage(); // Show home page via uiManager
      updateToolbarButtonsState(false); 
      updateStatusBar(); 
    }
  } catch (err) {
    console.error("Error checking for initial file path or loading archive:", err);
    showError(`处理启动参数或加载初始文件失败: ${err}`); 
    // Fallback to home page even on initial load error
    if (!isLoadingInitialFile) {
        showHomePage();
        updateToolbarButtonsState(false);
        updateStatusBar();
    }
  } finally {
    // Remove classes regardless of outcome
    document.body.classList.remove('initializing');
    if (isLoadingInitialFile) {
      document.body.classList.remove('loading-initial-file');
    }
    console.log("Initialization sequence finished, removing state classes.");
  }
}

// Initialize app when DOM is fully loaded
window.addEventListener("DOMContentLoaded", initializeApp);

// Disable default context menu / 禁用默认的上下文菜单
window.addEventListener('contextmenu', (e) => e.preventDefault());
