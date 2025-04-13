export interface LogoClickDependencies {
  getArchivePath: () => string;
  confirm: (message: string) => boolean;
  resetApp: () => void;
}

export function setupLogoClick(deps: LogoClickDependencies): void {
  const logo = document.querySelector('.logo');
  
  logo?.addEventListener('click', () => {
    if (deps.getArchivePath()) {
      // If an archive is open, ask for confirmation to return to home
      if (deps.confirm('是否返回主页？当前压缩包将被关闭。')) {
        deps.resetApp();
      }
    }
    // If no archive is open, clicking the logo might do nothing or navigate to home directly
    // Current behavior: only acts if an archive is open.
  });
}
