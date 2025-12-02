import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAdminNavigationStore = defineStore('adminNavigation', () => {
  const activeView = ref('dashboard');

  // Load from localStorage
  const loadState = () => {
    const savedView = localStorage.getItem('admin_activeView');
    if (savedView) {
      activeView.value = savedView;
    }
  };

  // Save state
  const saveActiveView = (view) => {
    activeView.value = view;
    localStorage.setItem('admin_activeView', view);
  };

  // Clear all saved state (for logout)
  const clearAllState = () => {
    activeView.value = 'dashboard';
    localStorage.removeItem('admin_activeView');
  };

  return {
    activeView,
    loadState,
    saveActiveView,
    clearAllState,
  };
});
