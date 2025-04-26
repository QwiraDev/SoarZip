/**
 * Search Setup Module - Configures search functionality
 * 搜索设置模块 - 配置搜索功能
 */

/**
 * Interface for dependencies needed by search setup
 * 搜索设置所需的依赖项接口
 */
export interface SearchDependencies {
  performSearch: (query: string) => void;
}

/**
 * Sets up event handlers for search input and button
 * 为搜索输入框和按钮设置事件处理程序
 * 
 * @param deps - Dependencies needed for search actions
 *             - 搜索操作所需的依赖项
 */
export function setupSearch(deps: SearchDependencies): void {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  
  // Search button click
  searchBtn?.addEventListener('click', () => {
    const searchText = (searchInput as HTMLInputElement)?.value;
    if (searchText) {
      deps.performSearch(searchText);
    }
  });
  
  // Trigger search on Enter key press
  searchInput?.addEventListener('keypress', (e: Event) => {
    // Check if the event is a KeyboardEvent before accessing 'key'
    if (e instanceof KeyboardEvent && e.key === 'Enter') {
      const searchText = (searchInput as HTMLInputElement)?.value;
      if (searchText) {
        deps.performSearch(searchText);
      }
    }
  });
} 