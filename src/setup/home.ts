import { showError } from '../ui/notification';

export interface HomeActionDependencies {
  openArchiveDialog: () => Promise<void>;
}

export function setupHomeActions(deps: HomeActionDependencies): void {
  console.log("Setting up home actions..."); // Log setup start
  const openArchiveBtn = document.getElementById('open-archive-btn');
  const newArchiveBtn = document.getElementById('new-archive-btn');
  
  if (!openArchiveBtn) {
    console.error("Open archive button not found!");
  }
  if (!newArchiveBtn) {
    console.error("New archive button not found!");
  }
  
  openArchiveBtn?.addEventListener('click', () => {
    console.log("Open archive button clicked"); // Log click
    deps.openArchiveDialog();
  });
  
  newArchiveBtn?.addEventListener('click', () => {
    console.log("New archive button clicked"); // Log click
    // Logic for creating a new archive (implement later)
    showError('该功能正在开发中...');
  });
  console.log("Home actions setup complete."); // Log setup end
} 