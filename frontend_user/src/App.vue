<template>
  <div v-if="isLoggedIn" class="app-container">
    <!-- Main Content -->
    <main class="main-content">
      <Dashboard 
        v-if="currentPage === 'dashboard'"
        :key="dashboardKey"
        @logout="handleLogout" 
        @navigate="handleNavigate"
      />
      <BorrowBooks 
        v-else-if="currentPage === 'borrow'"
        :currentUser="currentUser"
        @back="currentPage = 'dashboard'"
        @logout="handleLogout"
        @book-borrowed="handleBookBorrowed"
      />
      <BorrowHistory 
        v-else-if="currentPage === 'history'"
        :currentUser="currentUser"
        @back="currentPage = 'dashboard'"
        @logout="handleLogout"
      />
    </main>
  </div>
  <Login v-else-if="!showRegister" @login-success="handleLoginSuccess" @switch-to-register="showRegister = true" />
  <Register v-else @register-success="handleRegisterSuccess" @switch-to-login="showRegister = false" />
</template>

<script>
import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import Dashboard from "./components/Dashboard.vue";
import BorrowBooks from "./components/BorrowBooks.vue";
import BorrowHistory from "./components/BorrowHistory.vue";
import { useNavigationStore } from "./stores/navigationStore";

export default {
  components: {
    Login,
    Register,
    Dashboard,
    BorrowBooks,
    BorrowHistory,
  },
  data() {
    return {
      isLoggedIn: false,
      currentUser: null,
      showRegister: false,
      currentPage: "dashboard",
      dashboardKey: 0,
    };
  },
  mounted() {
    const reader = localStorage.getItem("reader");
    if (reader) {
      this.currentUser = JSON.parse(reader);
      this.isLoggedIn = true;
      
      // Load saved navigation state
      const navStore = useNavigationStore();
      navStore.loadState();
      this.currentPage = navStore.currentPage;
    }
  },
  methods: {
    handleLoginSuccess() {
      const reader = localStorage.getItem("reader");
      this.currentUser = JSON.parse(reader);
      this.isLoggedIn = true;
      this.currentPage = "dashboard";
      
      // Initialize navigation store on login
      const navStore = useNavigationStore();
      navStore.loadState();
    },
    handleRegisterSuccess() {
      this.showRegister = false;
    },
    handleNavigate(page) {
      this.currentPage = page;
      const navStore = useNavigationStore();
      navStore.saveCurrentPage(page);
      
      // Force Dashboard to reload when navigating back
      if (page === 'dashboard') {
        this.dashboardKey++;
      }
    },
    handleBookBorrowed() {
      // Giữ nguyên trang mượn sách, chỉ hiển thị thông báo thành công
      // this.currentPage = "dashboard";
    },
    handleLogout() {
      if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("reader");
        this.isLoggedIn = false;
        this.currentUser = null;
        this.currentPage = "dashboard";
        
        // Clear navigation state on logout
        const navStore = useNavigationStore();
        navStore.clearAllState();
      }
    },
  },
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: #f5f5f7;
}

#app {
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app-container {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  background: #f5f5f7;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .app-container {
    padding: 0;
  }
}
</style>

