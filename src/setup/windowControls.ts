import { minimizeWindow, maximizeWindow, closeWindow } from '../services/windowService';

export function setupWindowControls(): void {
  console.log("Setting up window controls..."); // Log setup start
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  if (!minimizeBtn || !maximizeBtn || !closeBtn) {
    console.error("Window control buttons not found!");
    return;
  }

  minimizeBtn.addEventListener('click', () => {
    console.log("Minimize button clicked"); // Log click
    minimizeWindow();
  });
  maximizeBtn.addEventListener('click', () => {
    console.log("Maximize button clicked"); // Log click
    maximizeWindow();
  });
  closeBtn.addEventListener('click', () => {
    console.log("Close button clicked"); // Log click
    closeWindow();
  });
  console.log("Window controls setup complete."); // Log setup end
} 