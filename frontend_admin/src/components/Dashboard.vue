<template>
  <div class="dashboard-wrapper">
    <!-- Main Header -->
    <header class="main-header">
      <div class="header-container">
        <div class="header-left">
          <div class="brand">
            <i class="fas fa-book-reader"></i>
            <div class="brand-text">
              <h1>Quản Lý Thư Viện</h1>
              <p>Khu Vực Quản Trị Viên</p>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <div class="user-details">
              <span class="user-name">{{ currentUser?.Ho_Ten || "Admin" }}</span>
              <span class="user-role">{{ currentUser?.Role === 'admin' ? 'Quản trị viên' : 'Nhân viên' }}</span>
            </div>
            <div class="user-avatar">
              <i class="fas fa-user"></i>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-notification">
              <i class="fas fa-bell"></i>
            </button>
            <button @click="handleLogout" class="btn-logout">
              <i class="fas fa-sign-out-alt"></i>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Navigation -->
    <nav class="main-nav">
      <div class="nav-container">
        <div class="nav-items">
          <button 
            @click="setActiveView('dashboard')"
            :class="['nav-item', { active: activeView === 'dashboard' }]">
            <i class="fas fa-home"></i>
            <span>Tổng quan</span>
          </button>
          <button 
            @click="setActiveView('books')"
            :class="['nav-item', { active: activeView === 'books' }]">
            <i class="fas fa-book"></i>
            <span>Quản lý sách</span>
          </button>
          <button 
            @click="setActiveView('readers')"
            :class="['nav-item', { active: activeView === 'readers' }]">
            <i class="fas fa-users"></i>
            <span>Quản lý độc giả</span>
          </button>
          <button 
            @click="setActiveView('borrows')"
            :class="['nav-item', { active: activeView === 'borrows' }]">
            <i class="fas fa-book-open"></i>
            <span>Mượn trả sách</span>
          </button>
          <button 
            @click="setActiveView('borrow-approval')"
            :class="['nav-item', { active: activeView === 'borrow-approval' }]">
            <i class="fas fa-check-circle"></i>
            <span>Xác nhận phiếu mượn</span>
          </button>
          <button 
            @click="setActiveView('publishers')"
            :class="['nav-item', { active: activeView === 'publishers' }]">
            <i class="fas fa-building"></i>
            <span>Nhà xuất bản</span>
          </button>
          <button 
            v-if="currentUser?.Role === 'admin'"
            @click="setActiveView('staff')"
            :class="['nav-item', { active: activeView === 'staff' }]">
            <i class="fas fa-user-tie"></i>
            <span>Nhân viên</span>
          </button>
          <button 
            @click="setActiveView('fines')"
            :class="['nav-item', { active: activeView === 'fines' }]">
            <i class="fas fa-money-bill"></i>
            <span>Tiền phạt</span>
          </button>
          <button 
            @click="setActiveView('statistics')"
            :class="['nav-item', { active: activeView === 'statistics' }]">
            <i class="fas fa-chart-bar"></i>
            <span>Thống kê</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="dashboard-content">

    <div class="content-area">
      <!-- Dashboard Overview -->
      <div v-if="activeView === 'dashboard'" class="view-content">
        <div class="welcome-section">
          <h1 class="welcome-title">
            Chào mừng, {{ currentUser?.Ho_Ten || "Quản trị viên" }}
          </h1>
          <p class="welcome-date">{{ getCurrentDate() }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons-section">
          <button @click="updateOverdueStatus" class="btn-action btn-primary">
            <i class="fas fa-sync-alt"></i>
            <span>Cập Nhật Trạng Thái Quá Hạn</span>
          </button>
        </div>

      <!-- Stats Cards Grid -->
      <div class="row g-3 mb-3">
        <!-- Total Books Card -->
        <div class="col-md-6 col-lg-3">
          <div
            class="card border-0 shadow-sm h-100"
            style="
              background: linear-gradient(
                135deg,
                rgba(99, 102, 241, 0.1),
                rgba(139, 92, 246, 0.1)
              );
              backdrop-filter: blur(10px);
            "
          >
            <div class="card-body p-3">
              <div
                class="d-flex align-items-center justify-content-between mb-2"
              >
                <h6
                  class="card-title mb-0"
                  style="
                    color: #a0a0b0;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                  "
                >
                  Tổng Đầu Sách
                </h6>
                <div
                  class="rounded p-1"
                  style="background: linear-gradient(135deg, #6366f1, #8b5cf6)"
                >
                  <i
                    class="fas fa-book"
                    style="color: #ffffff; font-size: 1rem"
                  ></i>
                </div>
              </div>
              <h3
                class="fw-bold mb-2"
                style="color: #1a1a1a; font-size: 1.5rem"
              >
                {{ stats.totalBooks }}
              </h3>
              <small style="color: #10b981">
                <i class="fas fa-copy"></i> {{ stats.totalCopies }} quyển
              </small>
            </div>
          </div>
        </div>

        <!-- Total Readers Card -->
        <div class="col-md-6 col-lg-3">
          <div
            class="card border-0 shadow-sm h-100"
            style="
              background: linear-gradient(
                135deg,
                rgba(99, 102, 241, 0.1),
                rgba(139, 92, 246, 0.1)
              );
              backdrop-filter: blur(10px);
            "
          >
            <div class="card-body p-3">
              <div
                class="d-flex align-items-center justify-content-between mb-2"
              >
                <h6
                  class="card-title mb-0"
                  style="
                    color: #a0a0b0;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                  "
                >
                  Tổng Độc Giả
                </h6>
                <div
                  class="rounded p-1"
                  style="background: linear-gradient(135deg, #a78bfa, #c4b5fd)"
                >
                  <i
                    class="fas fa-users"
                    style="color: #ffffff; font-size: 1rem"
                  ></i>
                </div>
              </div>
              <h3
                class="fw-bold mb-2"
                style="color: #1a1a1a; font-size: 1.5rem"
              >
                {{ stats.totalReaders }}
              </h3>
              <small style="color: #10b981">
                <i class="fas fa-users"></i> Độc giả
              </small>
            </div>
          </div>
        </div>

        <!-- Currently Borrowed Card -->
        <div class="col-md-6 col-lg-3">
          <div
            class="card border-0 shadow-sm h-100"
            style="
              background: linear-gradient(
                135deg,
                rgba(99, 102, 241, 0.1),
                rgba(139, 92, 246, 0.1)
              );
              backdrop-filter: blur(10px);
            "
          >
            <div class="card-body p-3">
              <div
                class="d-flex align-items-center justify-content-between mb-2"
              >
                <h6
                  class="card-title mb-0"
                  style="
                    color: #a0a0b0;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                  "
                >
                  Đang Mượn
                </h6>
                <div
                  class="rounded p-1"
                  style="background: linear-gradient(135deg, #f59e0b, #fbbf24)"
                >
                  <i
                    class="fas fa-book-open"
                    style="color: #ffffff; font-size: 1rem"
                  ></i>
                </div>
              </div>
              <h3
                class="fw-bold mb-2"
                style="color: #1a1a1a; font-size: 1.5rem"
              >
                {{ stats.currentBorrows }}
              </h3>
              <small style="color: #f59e0b">
                <i class="fas fa-book-open"></i> Đang mượn
              </small>
            </div>
          </div>
        </div>

        <!-- Staff Card -->
        <div class="col-md-6 col-lg-3">
          <div
            class="card border-0 shadow-sm h-100"
            style="
              background: linear-gradient(
                135deg,
                rgba(99, 102, 241, 0.1),
                rgba(139, 92, 246, 0.1)
              );
              backdrop-filter: blur(10px);
            "
          >
            <div class="card-body p-3">
              <div
                class="d-flex align-items-center justify-content-between mb-2"
              >
                <h6
                  class="card-title mb-0"
                  style="
                    color: #a0a0b0;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                  "
                >
                  Nhân Viên
                </h6>
                <div
                  class="rounded p-1"
                  style="background: linear-gradient(135deg, #10b981, #34d399)"
                >
                  <i
                    class="fas fa-user-tie"
                    style="color: #ffffff; font-size: 1rem"
                  ></i>
                </div>
              </div>
              <h3
                class="fw-bold mb-2"
                style="color: #1a1a1a; font-size: 1.5rem"
              >
                {{ stats.totalStaff }}
              </h3>
              <small style="color: #10b981">
                <i class="fas fa-user-tie"></i> Nhân viên
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Row -->
      <div class="row g-3">
        <!-- Activity Timeline -->
        <div class="col-lg-8">
          <div
            class="card border-0 shadow-sm"
            style="
              background: white;
              backdrop-filter: blur(10px);
            "
          >
            <div
              class="card-header border-0 px-3 py-2"
              style="
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                border-bottom: 1px solid #2a2a3e;
              "
            >
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0 fw-bold text-white" style="font-size: 1rem">
                  <i class="fas fa-chart-line me-2"></i>Hoạt Động Gần Đây
                </h5>
                <a
                  href="#"
                  style="
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 0.8rem;
                  "
                  >Xem tất cả</a
                >
              </div>
            </div>
            <div class="card-body p-3">
              <!-- Loading -->
              <div v-if="isLoadingStats" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
              </div>
              <!-- No activities -->
              <div v-else-if="recentActivities.length === 0" class="text-center py-3">
                <p style="color: #666; font-size: 0.9rem">
                  <i class="fas fa-info-circle me-2"></i>
                  Chưa có hoạt động nào
                </p>
              </div>
              <!-- Activities list -->
              <div v-else class="activity-list">
                <div 
                  v-for="activity in recentActivities" 
                  :key="activity.id" 
                  class="activity-item d-flex align-items-start mb-3 pb-3"
                  style="border-bottom: 1px solid #eee;"
                >
                  <div 
                    class="activity-icon me-3 d-flex align-items-center justify-content-center rounded-circle"
                    :style="{
                      width: '40px',
                      height: '40px',
                      minWidth: '40px',
                      background: activity.type === 'return' ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : activity.type === 'overdue' ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white'
                    }"
                  >
                    <i :class="activity.type === 'return' ? 'fas fa-check' : activity.type === 'overdue' ? 'fas fa-exclamation' : 'fas fa-book'"></i>
                  </div>
                  <div class="activity-content flex-grow-1">
                    <p class="mb-1" style="color: #1a1a1a; font-size: 0.9rem; font-weight: 500;">
                      <span style="color: #6366f1; font-weight: 600;">{{ activity.readerName }}</span>
                      {{ activity.type === 'return' ? 'đã trả sách' : activity.type === 'overdue' ? 'quá hạn trả' : 'đã mượn sách' }}
                    </p>
                    <p class="mb-1" style="color: #666; font-size: 0.85rem;">
                      <i class="fas fa-book-open me-1"></i>{{ activity.bookTitle }}
                    </p>
                    <small style="color: #999;">
                      <i class="fas fa-clock me-1"></i>
                      {{ formatDateTime(activity.date) }}
                    </small>
                  </div>
                  <span 
                    class="badge"
                    :style="{
                      background: activity.type === 'return' ? '#dcfce7' 
                        : activity.type === 'overdue' ? '#fee2e2'
                        : '#dbeafe',
                      color: activity.type === 'return' ? '#166534' 
                        : activity.type === 'overdue' ? '#991b1b'
                        : '#1e40af',
                      fontSize: '0.75rem',
                      padding: '4px 8px'
                    }"
                  >
                    {{ activity.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="col-lg-4">
          <!-- Profile Card -->
          <div
            class="card border-0 shadow-sm mb-3"
            style="
              background: white;
              backdrop-filter: blur(10px);
            "
          >
            <div
              class="card-header border-0 px-3 py-2"
              style="
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                border-bottom: 1px solid #2a2a3e;
              "
            >
              <h5 class="mb-0 fw-bold text-white" style="font-size: 1rem">
                <i class="fas fa-user-circle me-2"></i>Thông Tin Tài Khoản
              </h5>
            </div>
            <div class="card-body p-3 text-center">
              <div
                class="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style="
                  width: 80px;
                  height: 80px;
                  background: linear-gradient(135deg, #6366f1, #8b5cf6);
                  color: white;
                  font-size: 2rem;
                  font-weight: bold;
                "
              >
                <i class="fas fa-user"></i>
              </div>
              <h5 class="fw-bold mb-1" style="color: #1a1a1a">
                {{ currentUser?.Ho_Ten || "Quản trị viên" }}
              </h5>
              <p class="mb-3" style="color: #666; font-size: 0.9rem">
                Administrator
              </p>
              <div class="row text-start">
                <div class="col-12 mb-2">
                  <small style="color: #999">Mã nhân viên:</small>
                  <div style="color: #1a1a1a; font-weight: 600">
                    {{ currentUser?.Ma_Nhan_Vien || "NV001" }}
                  </div>
                </div>
                <div class="col-12 mb-2">
                  <small style="color: #a0a0b0">Trạng thái:</small>
                  <div style="color: #10b981; font-weight: 600">
                    <i class="fas fa-circle" style="font-size: 0.5rem"></i> Đang hoạt động
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <!-- Books Management -->
      <BookList v-else-if="activeView === 'books'" />
      
      <!-- Readers Management -->
      <ReaderList v-else-if="activeView === 'readers'" />
      
      <!-- Borrow Management -->
      <BorrowList v-else-if="activeView === 'borrows'" />
      
      <!-- Borrow Approval Management -->
      <BorrowApproval v-else-if="activeView === 'borrow-approval'" />
      
      <!-- Publishers Management -->
      <PublisherList v-else-if="activeView === 'publishers'" />
      
      <!-- Staff Management -->
      <StaffList v-else-if="activeView === 'staff'" />
      
      <!-- Fines Management -->
      <FineList v-else-if="activeView === 'fines'" />
      
      <!-- Statistics -->
      <Statistics v-else-if="activeView === 'statistics'" />
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import axios from "axios";
import BookList from './BookList.vue';
import ReaderList from './ReaderList.vue';
import BorrowList from './BorrowList.vue';
import BorrowApproval from './BorrowApproval.vue';
import PublisherList from './PublisherList.vue';
import StaffList from './StaffList.vue';
import FineList from './FineList.vue';
import Statistics from './Statistics.vue';
import { success, error } from '../utils/toast';
import { useAdminNavigationStore } from '../stores/adminNavigationStore';
import socketService from '../utils/socket';

const props = defineProps({
  currentUser: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['logout']);

const navStore = useAdminNavigationStore();

// Expose activeView from store
const activeView = computed(() => navStore.activeView);

// Dashboard stats
const stats = ref({
  totalBooks: 0,
  totalCopies: 0,
  totalReaders: 0,
  currentBorrows: 0,
  totalStaff: 0,
});

const recentActivities = ref([]);
const isLoadingStats = ref(false);
let pollInterval = null;

onMounted(() => {
  // Load saved navigation state
  navStore.loadState();
  // Load dashboard stats
  loadDashboardStats();
  
  // Socket connection for real-time updates
  try {
    socketService.connect();
    
    socketService.on('books:updated', () => {
      console.log('Real-time: books updated');
      loadDashboardStats();
    });
    
    socketService.on('borrow:updated', () => {
      console.log('Real-time: borrow updated');
      loadDashboardStats();
    });
    
    socketService.on('borrow:created', () => {
      console.log('Real-time: borrow created');
      loadDashboardStats();
    });
  } catch (e) {
    console.warn('Socket connection failed:', e);
  }
  
  // Polling backup every 5 seconds
  pollInterval = setInterval(() => {
    loadDashboardStats();
  }, 5000);
});

onUnmounted(() => {
  // Cleanup socket listeners
  try {
    socketService.off('books:updated');
    socketService.off('borrow:updated');
    socketService.off('borrow:created');
  } catch (e) {
    console.warn('Socket cleanup error:', e);
  }
  
  // Clear polling interval
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});

const loadDashboardStats = async () => {
  isLoadingStats.value = true;
  try {
    const [booksRes, readersRes, borrowsRes, staffRes] = await Promise.all([
      axios.get('http://localhost:5000/api/books?limit=1000'),
      axios.get('http://localhost:5000/api/readers'),
      axios.get('http://localhost:5000/api/borrows'),
      axios.get('http://localhost:5000/api/staff'),
    ]);

    // Books API returns { data: [...], pagination: {...} }
    const books = booksRes.data?.data || (Array.isArray(booksRes.data) ? booksRes.data : []);
    const borrows = Array.isArray(borrowsRes.data) ? borrowsRes.data : [];
    
    stats.value.totalBooks = books.length;
    stats.value.totalCopies = books.reduce((sum, book) => sum + (book.So_Quyen || 0), 0);
    stats.value.totalReaders = Array.isArray(readersRes.data) ? readersRes.data.length : 0;
    stats.value.currentBorrows = borrows.filter(b => b.trang_thai === 'Đang mượn').length;
    stats.value.totalStaff = Array.isArray(staffRes.data) ? staffRes.data.length : 0;
    
    // Lấy hoạt động gần đây (sắp xếp theo ngày mượn/trả mới nhất)
    const activities = borrows.map(b => {
      const isReturned = b.trang_thai === 'Đã trả';
      const isOverdue = b.trang_thai === 'Quá hạn';
      
      // Lấy thông tin độc giả (populate từ Ma_Doc_Gia)
      const reader = b.Ma_Doc_Gia;
      let readerName = 'Độc giả';
      if (reader && typeof reader === 'object') {
        readerName = `${reader.Ho_Lot || ''} ${reader.Ten || ''}`.trim() || 'Độc giả';
      }
      
      // Lấy thông tin sách (populate từ Ma_Sach)
      const book = b.Ma_Sach;
      let bookTitle = 'Sách';
      if (book && typeof book === 'object') {
        bookTitle = book.Ten_Sach || 'Sách';
      }
      
      return {
        id: b._id,
        type: isReturned ? 'return' : (isOverdue ? 'overdue' : 'borrow'),
        readerName,
        bookTitle,
        date: isReturned ? b.Ngay_Tra : b.Ngay_Muon,
        status: b.trang_thai
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5); // Lấy 5 hoạt động gần nhất
    
    recentActivities.value = activities;
  } catch (err) {
    console.error('Error loading stats:', err);
    error('Lỗi khi tải dữ liệu thống kê');
  } finally {
    isLoadingStats.value = false;
  }
};

const setActiveView = (view) => {
  navStore.saveActiveView(view);
};

const getCurrentDate = () => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date().toLocaleDateString("vi-VN", options);
};

// Format ngày theo múi giờ Việt Nam (chỉ hiển thị ngày, không hiển thị giờ)
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const handleLogout = () => {
  emit('logout');
};

const updateOverdueStatus = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/borrows/auto-update-overdue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    success(`${data.message}\nĐã cập nhật: ${data.updatedCount}/${data.totalOverdue}`);
    // Reload stats after update
    loadDashboardStats();
  } catch (err) {
    error(`Lỗi cập nhật: ${err.message}`);
  }
};
</script>

<style scoped>
@import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
@import "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";

.dashboard-wrapper {
  min-height: 100vh;
  background: white;
  margin: 0;
  padding: 0;
  width: 100%;
}

/* Main Header */
.main-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand i {
  font-size: 2.5rem;
  color: #ffd700;
}

.brand-text h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.brand-text p {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-details {
  text-align: right;
}

.user-name {
  display: block;
  font-weight: 600;
  font-size: 1rem;
}

.user-role {
  display: block;
  font-size: 0.8rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  margin-top: 0.25rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-notification {
  background: #f0f0f0;
  border: none;
  color: #333;
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-notification:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.btn-logout {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-logout:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* Main Navigation */
.main-nav {
  background: #f8f9fa;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 0;
}

.nav-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
}

.nav-items {
  display: flex;
  gap: 0;
  overflow-x: auto;
}

.nav-item {
  background: transparent;
  border: none;
  color: #666;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.nav-item:hover {
  color: #333;
  background: rgba(102, 126, 234, 0.05);
}

.nav-item.active {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  border-bottom-color: #6366f1;
}

.nav-item i {
  font-size: 1.1rem;
}

/* Content Area */
.content-area {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.view-content {
  padding: 2rem;
  background: white;
}

.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.welcome-date {
  font-size: 1rem;
  color: #666;
}

/* Action Buttons Section */
.action-buttons-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-action.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-action.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-action i {
  font-size: 1.1rem;
}

/* Dashboard Content */
.dashboard-content {
  padding: 0;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f0f0f0;
}

::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}

.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.2) !important;
}

.btn:hover {
  transform: translateY(-2px);
}

.container-fluid {
  padding-left: 1rem !important;
  padding-right: 1rem !important;
  max-width: 100% !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-container {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-right {
    gap: 1rem;
  }

  .user-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-details {
    text-align: center;
  }

  .brand-text h1 {
    font-size: 1.5rem;
  }

  .dashboard-content {
    padding: 1rem;
  }

  .container-fluid {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
}
</style>
