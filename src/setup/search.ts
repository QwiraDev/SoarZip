export interface SearchDependencies {
  performSearch: (query: string) => void;
}

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