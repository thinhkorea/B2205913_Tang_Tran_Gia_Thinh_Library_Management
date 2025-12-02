<template>
  <div v-if="isLoggedIn" class="app-container">
    <Dashboard :currentUser="currentUser" @logout="handleLogout" />
  </div>
  <Login v-else @login-success="handleLoginSuccess" />
</template>

<script>
import Login from "./components/Login.vue";
import Dashboard from "./components/Dashboard.vue";
import { useAdminNavigationStore } from "./stores/adminNavigationStore";

export default {
  components: {
    Login,
    Dashboard,
  },
  data() {
    return {
      isLoggedIn: false,
      currentUser: null,
    };
  },
  mounted() {
    const staff = localStorage.getItem("staff");
    if (staff) {
      this.currentUser = JSON.parse(staff);
      this.isLoggedIn = true;
      
      // Load saved navigation state
      const navStore = useAdminNavigationStore();
      navStore.loadState();
    }
  },
  methods: {
    handleLoginSuccess() {
      const staff = localStorage.getItem("staff");
      this.currentUser = JSON.parse(staff);
      this.isLoggedIn = true;
      
      // Initialize navigation store on login
      const navStore = useAdminNavigationStore();
      navStore.loadState();
    },
    handleLogout() {
      if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("staff");
        this.isLoggedIn = false;
        this.currentUser = null;
        
        // Clear navigation state on logout
        const navStore = useAdminNavigationStore();
        navStore.clearAllState();
      }
    },
  },
};
</script>

<style scoped>
.app-container {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}
</style>
