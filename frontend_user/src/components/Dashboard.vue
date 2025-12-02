<template>
  <div class="dashboard-wrapper">
    <!-- Header -->
    <Header 
      title="Thư Viện Học Viên"
      subtitle="Hệ thống quản lý mượn sách"
      :userName="`${currentUser?.Ho_Lot} ${currentUser?.Ten}`"
      :hasBotMargin="true"
      @logout="$emit('logout')"
    />

    <!-- Main Content -->
    <main class="dashboard-content">
      <!-- Welcome Section -->
      <section class="welcome-card">
        <h2>Chào mừng, {{ currentUser?.Ho_Lot }} {{ currentUser?.Ten }}!</h2>
        <p>{{ getGreeting() }}</p>
      </section>

      <!-- Action Buttons -->
      <section class="action-buttons">
        <button @click="$emit('navigate', 'borrow')" class="btn-action btn-primary">
          <i class="fas fa-plus-circle"></i>
          <span>Mượn Sách</span>
        </button>
        <button @click="$emit('navigate', 'history')" class="btn-action btn-secondary">
          <i class="fas fa-history"></i>
          <span>Lịch Sử Mượn</span>
        </button>
      </section>

      <!-- Quick Stats -->
      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="stat-info">
            <h4>Sách Đang Mượn</h4>
            <p class="stat-value">{{ myBorrows.filter(b => b.trang_thai === 'Đang mượn').length }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <h4>Quá Hạn</h4>
            <p class="stat-value">{{ overdueBooks }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="stat-info">
            <h4>Ngày Đăng Ký</h4>
            <p class="stat-value">{{ formatDate(currentUser?.Ngay_Dang_Ky) }}</p>
          </div>
        </div>

        <div class="stat-card" :class="{ 'debt-warning': totalDebt > 0 }">
          <div class="stat-icon" :style="totalDebt > 0 ? 'background: linear-gradient(135deg, #ff6b6b, #ee5a6f)' : 'background: linear-gradient(135deg, #22c55e, #16a34a)'">
            <i :class="totalDebt > 0 ? 'fas fa-money-bill' : 'fas fa-check-circle'"></i>
          </div>
          <div class="stat-info">
            <h4>Nợ Tiền Phạt</h4>
            <p class="stat-value" :class="{ 'debt-amount': totalDebt > 0 }">{{ formatPrice(totalDebt) }}</p>
          </div>
        </div>
      </section>

      <!-- Profile Info -->
      <section class="profile-section">
        <h3>Thông Tin Cá Nhân</h3>
        <div class="profile-info">
          <div class="info-row">
            <span class="label">Mã Độc Giả:</span>
            <span class="value">{{ currentUser?.Ma_Doc_Gia || "-" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">{{ currentUser?.Email || "-" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Số Điện Thoại:</span>
            <span class="value">{{ currentUser?.Dien_Thoai || "-" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Địa Chỉ:</span>
            <span class="value">{{ currentUser?.Dia_Chi || "-" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Trạng Thái:</span>
            <span class="value" :class="{ 'status-active': currentUser?.Tinh_Trang === '1' }">
              {{ currentUser?.Tinh_Trang === '1' ? 'Hoạt động' : 'Vô hiệu' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Debt Section -->
      <section v-if="totalDebt > 0" class="debt-section">
        <h3>Nợ Tiền Phạt</h3>
        <div class="debt-info">
          <div class="debt-amount">
            <span class="label">Tổng Tiền Nợ:</span>
            <span class="amount">{{ formatPrice(totalDebt) }}</span>
          </div>
          <p class="debt-note">Bạn có sách quá hạn. Vui lòng liên hệ với nhân viên thư viện để trả sách.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import axios from "axios";
import { useBorrowStore } from "../stores/borrowStore.js";
import Header from "./Header.vue";

export default {
  name: "Dashboard",
  components: {
    Header,
  },
  data() {
    return {
      currentUser: null,
      myBorrows: [],
      unpaidFinesTotal: 0,
    };
  },
  computed: {
    borrowStore() {
      return useBorrowStore();
    },
    overdueBooks() {
      return this.myBorrows.filter((borrow) => {
        const returnDate = new Date(borrow.Ngay_Hen_Tra);
        return returnDate < new Date() && borrow.trang_thai === "Đang mượn";
      }).length;
    },
    totalDebt() {
      // Lấy từ API fines (chính xác hơn là tổng tiền chưa thanh toán)
      return this.unpaidFinesTotal;
    },
  },
  async mounted() {
    try {
      const reader = localStorage.getItem("reader");
      if (reader) {
        this.currentUser = JSON.parse(reader);
        console.log("User loaded:", this.currentUser?.Ho_Lot, this.currentUser?.Ten);
      }
      // Auto-create fine records cho những sách quá hạn
      await this.autoCreateOverdueFines();
      // Tải dữ liệu mượn
      await this.loadBorrowData();
      // Tải tiền phạt từ API
      await this.loadFineData();
      console.log("All data loaded");
    } catch (error) {
      console.error("Lỗi mounted:", error);
    }
  },
  methods: {
    async autoCreateOverdueFines() {
      try {
        console.log("Auto-creating fine records for overdue books...");
        const response = await axios.post(
          `http://localhost:5000/api/fines/auto-create`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Auto-create result:", response.data);
      } catch (error) {
        console.error("Lỗi auto-create fine:", error);
      }
    },
    async loadBorrowData() {
      try {
        const reader = JSON.parse(localStorage.getItem("reader"));
        console.log("Fetching borrows for reader:", reader._id);
        const response = await axios.get(
          `http://localhost:5000/api/borrows?Ma_Doc_Gia=${reader._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        this.myBorrows = response.data || [];
        console.log("Dữ liệu mượn đã tải:", this.myBorrows.length, "bản ghi");
        if (this.myBorrows.length > 0) {
          console.log("Mượn đầu tiên:", this.myBorrows[0]);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử mượn:", error);
      }
    },
    calculateFines() {
      try {
        console.log("Starting fine calculation with", this.myBorrows.length, "borrows");
        // Tính tiền phạt từ những sách chưa trả mà quá hạn
        let totalOverdueFine = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.myBorrows.forEach((borrow, idx) => {
          // Chỉ phạt nếu: chưa trả + quá hạn
          if (borrow.trang_thai === "Đang mượn") {
            const dueDate = new Date(borrow.Ngay_Hen_Tra);
            dueDate.setHours(0, 0, 0, 0);
            
            if (today > dueDate) {
              // Tính số ngày quá hạn
              const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
              // Tiền phạt = Giá sách × Số ngày trễ
              const bookPrice = borrow.Ma_Sach?.Don_Gia || 0;
              const fine = daysLate * bookPrice;
              totalOverdueFine += fine;
              console.log(`Borrow ${idx}: ${daysLate} days late, price ${bookPrice}, fine: ${fine}`);
            }
          }
        });
        
        console.log("Tính tiền phạt (cách cũ - không dùng nữa):", totalOverdueFine);
      } catch (error) {
        console.error("Lỗi tính tiền phạt:", error);
      }
    },
    async loadFineData() {
      try {
        const reader = JSON.parse(localStorage.getItem("reader"));
        console.log("Fetching fines for reader:", reader._id);
        const response = await axios.get(
          `http://localhost:5000/api/fines/unpaid/${reader._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // API trả về { totalFine, count } hoặc { totalFine: 0, count: 0 }
        this.unpaidFinesTotal = response.data.totalFine || 0;
        console.log("Tiền phạt đã tải:", this.unpaidFinesTotal);
      } catch (error) {
        console.error("Lỗi tải tiền phạt:", error);
        this.unpaidFinesTotal = 0;
      }
    },
    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("vi-VN");
    },
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price || 0);
    },
    getGreeting() {
      const hour = new Date().getHours();
      if (hour < 12) return "Chúc bạn một buổi sáng tốt lành! ☀️";
      if (hour < 18) return "Chúc bạn một buổi chiều tốt lành! 🌤️";
      return "Chúc bạn một buổi tối tốt lành! 🌙";
    },
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard-wrapper {
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Header */
/* Content */
.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  flex: 1;
}

/* Welcome Card */
.welcome-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.welcome-card h2 {
  font-size: 1.8rem;
  margin: 0 0 0.5rem 0;
}

.welcome-card p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.stat-info h4 {
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.stat-card.debt-warning {
  border: 2px solid #ff6b6b;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(238, 90, 111, 0.05));
}

.stat-card.debt-warning .stat-info h4 {
  color: #dc2626;
}

.stat-value.debt-amount {
  color: #dc2626;
  font-size: 1.35rem;
}

/* Fine Details Section */
.fine-details-section {
  background: white;
  border: 2px solid #fcd34d;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(252, 211, 77, 0.15);
}

.fine-info-box {
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.5), rgba(253, 230, 138, 0.5));
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #f59e0b;
}

.fine-formula {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
}

.fine-formula p {
  margin: 0;
  color: #92400e;
  font-size: 0.95rem;
}

.fine-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.fine-total span:first-child {
  font-weight: 600;
  color: #92400e;
  font-size: 0.9rem;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #dc2626;
}

.fine-note {
  margin: 0;
  font-size: 0.85rem;
  color: #dc2626;
  font-weight: 500;
  text-align: center;
}

/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.btn-action {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.btn-action i {
  font-size: 1.5rem;
}

.btn-primary {
  border-color: #667eea;
  color: #667eea;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  border-color: #f093fb;
  color: #f093fb;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(240, 147, 251, 0.3);
}

/* Debt Section */
.debt-section {
  background: white;
  border: 2px solid #ff6b6b;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.15);
}

.debt-section h3 {
  font-size: 1.25rem;
  color: #dc2626;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.debt-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.debt-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(238, 90, 111, 0.05));
  border-radius: 8px;
  border-left: 4px solid #dc2626;
}

.debt-amount .label {
  font-weight: 600;
  color: #7f1d1d;
  font-size: 0.95rem;
}

.debt-amount .amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
}

.debt-note {
  margin: 0;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Profile Section */
.profile-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.profile-section h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.profile-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #718096;
  font-size: 0.9rem;
}

.value {
  color: #2d3748;
  font-weight: 500;
}

.status-active {
  color: #38a169 !important;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-user {
    justify-content: center;
    width: 100%;
  }

  .dashboard-content {
    padding: 1rem;
  }

  .welcome-card {
    padding: 1.5rem;
  }

  .welcome-card h2 {
    font-size: 1.5rem;
  }

  .stats-section,
  .action-buttons {
    grid-template-columns: 1fr;
  }

  .profile-info {
    grid-template-columns: 1fr;
  }

  .btn-action {
    flex-direction: column;
  }
}
</style>
