import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNavigationStore = defineStore('navigation', () => {
  const currentPage = ref('dashboard');
  const borrowBooksState = ref({
    searchQuery: '',
    selectedAuthor: null,
    selectedPublisher: null,
    currentPage: 1,
  });
  const borrowHistoryState = ref({
    filterStatus: null,
    currentPage: 1,
  });

  // Load from localStorage
  const loadState = () => {
    const savedNav = localStorage.getItem('app_currentPage');
    if (savedNav) {
      currentPage.value = savedNav;
    }

    const savedBorrowBooks = localStorage.getItem('app_borrowBooks_state');
    if (savedBorrowBooks) {
      try {
        borrowBooksState.value = JSON.parse(savedBorrowBooks);
      } catch (e) {
        console.error('Error loading borrowBooks state:', e);
      }
    }

    const savedBorrowHistory = localStorage.getItem('app_borrowHistory_state');
    if (savedBorrowHistory) {
      try {
        borrowHistoryState.value = JSON.parse(savedBorrowHistory);
      } catch (e) {
        console.error('Error loading borrowHistory state:', e);
      }
    }
  };

  // Save state
  const saveCurrentPage = (page) => {
    currentPage.value = page;
    localStorage.setItem('app_currentPage', page);
  };

  const saveBorrowBooksState = (state) => {
    borrowBooksState.value = state;
    localStorage.setItem('app_borrowBooks_state', JSON.stringify(state));
  };

  const saveBorrowHistoryState = (state) => {
    borrowHistoryState.value = state;
    localStorage.setItem('app_borrowHistory_state', JSON.stringify(state));
  };

  // Clear all saved state (for logout)
  const clearAllState = () => {
    currentPage.value = 'dashboard';
    borrowBooksState.value = {
      searchQuery: '',
      selectedAuthor: null,
      selectedPublisher: null,
      currentPage: 1,
    };
    borrowHistoryState.value = {
      filterStatus: null,
      currentPage: 1,
    };
    localStorage.removeItem('app_currentPage');
    localStorage.removeItem('app_borrowBooks_state');
    localStorage.removeItem('app_borrowHistory_state');
  };

  return {
    currentPage,
    borrowBooksState,
    borrowHistoryState,
    loadState,
    saveCurrentPage,
    saveBorrowBooksState,
    saveBorrowHistoryState,
    clearAllState,
  };
});
