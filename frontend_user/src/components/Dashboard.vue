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
        <button @click="handleRefresh" class="btn-action btn-tertiary" :disabled="isRefreshing">
          <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
          <span>{{ isRefreshing ? 'Đang cập nhật...' : 'Cập Nhật' }}</span>
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
        <div class="profile-header">
          <h3>Thông Tin Cá Nhân</h3>
          <button @click="isEditingProfile = true" class="btn-edit-profile">
            <i class="fas fa-edit"></i> Chỉnh Sửa
          </button>
        </div>
        
        <div class="profile-info">
          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-id-card"></i>
            </div>
            <div class="info-content">
              <span class="label">Mã Độc Giả</span>
              <span class="value">{{ currentUser?.Ma_Doc_Gia || "-" }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="info-content">
              <span class="label">Email</span>
              <span class="value">{{ currentUser?.Email || "-" }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-phone"></i>
            </div>
            <div class="info-content">
              <span class="label">Số Điện Thoại</span>
              <span class="value">{{ currentUser?.Dien_Thoai || "-" }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="info-content">
              <span class="label">Địa Chỉ</span>
              <span class="value">{{ currentUser?.Dia_Chi || "-" }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-calendar"></i>
            </div>
            <div class="info-content">
              <span class="label">Ngày Đăng Ký</span>
              <span class="value">{{ formatDate(currentUser?.Ngay_Dang_Ky) }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="info-content">
              <span class="label">Trạng Thái</span>
              <span class="value" :class="{ 'status-active': currentUser?.Tinh_Trang === '1' }">
                {{ currentUser?.Tinh_Trang === '1' ? '✓ Hoạt động' : '✗ Vô hiệu' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Edit Profile Modal -->
      <div v-if="isEditingProfile" class="modal-overlay" @click.self="isEditingProfile = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Chỉnh Sửa Thông Tin Cá Nhân</h3>
            <button @click="isEditingProfile = false" class="btn-close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form @submit.prevent="updateProfile" class="edit-form">
            <!-- Họ -->
            <div class="form-group">
              <label>Họ <span class="required">*</span></label>
              <input 
                v-model="editForm.Ho_Lot" 
                type="text" 
                placeholder="Nhập họ"
                required
              />
            </div>

            <!-- Tên -->
            <div class="form-group">
              <label>Tên <span class="required">*</span></label>
              <input 
                v-model="editForm.Ten" 
                type="text" 
                placeholder="Nhập tên"
                required
              />
            </div>

            <!-- Ngày Sinh -->
            <div class="form-group">
              <label>Ngày Sinh</label>
              <input 
                v-model="editForm.Ngay_Sinh" 
                type="date"
              />
            </div>

            <!-- Giới Tính -->
            <div class="form-group">
              <label>Giới Tính</label>
              <select v-model="editForm.Phai">
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label>Email <span class="required">*</span></label>
              <input 
                v-model="editForm.Email" 
                type="email" 
                placeholder="example@email.com"
                required
              />
            </div>

            <!-- Số Điện Thoại -->
            <div class="form-group">
              <label>Số Điện Thoại <span class="required">*</span></label>
              <input 
                v-model="editForm.Dien_Thoai" 
                type="tel" 
                placeholder="0123456789"
                required
              />
            </div>

            <!-- Địa Chỉ -->
            <div class="form-group">
              <label>Địa Chỉ <span class="required">*</span></label>
              <textarea 
                v-model="editForm.Dia_Chi" 
                placeholder="Nhập địa chỉ"
                rows="3"
                required
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-submit">
                <i class="fas fa-save"></i> Lưu Thay Đổi
              </button>
              <button type="button" @click="isEditingProfile = false" class="btn-cancel">
                <i class="fas fa-times"></i> Hủy
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Upcoming Return Section -->
      <section v-if="upcomingReturns.length > 0" class="upcoming-section">
        <h3>Sách Sắp Hết Hạn (trong 3 ngày)</h3>
        <div class="upcoming-books">
          <div v-for="borrow in upcomingReturns" :key="borrow._id" class="upcoming-item">
            <div class="book-info-inline">
              <span class="book-name">{{ borrow.Ma_Sach?.Ten_Sach || 'N/A' }}</span>
              <span class="return-date">{{ formatDate(borrow.Ngay_Hen_Tra) }}</span>
            </div>
            <div class="days-left" :class="{ urgent: daysUntilReturn(borrow.Ngay_Hen_Tra) <= 1 }">
              Còn {{ daysUntilReturn(borrow.Ngay_Hen_Tra) }} ngày
            </div>
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
import { showToast } from "../utils/toast.js";
import socketService from "../utils/socket.js";

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
      isEditingProfile: false,
      editForm: {},
      unsubscribe: null,
      isRefreshing: false,
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
    upcomingReturns() {
      const now = new Date();
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      return this.myBorrows
        .filter((borrow) => {
          const returnDate = new Date(borrow.Ngay_Hen_Tra);
          return returnDate > now && returnDate <= in3Days && borrow.trang_thai === "Đang mượn";
        })
        .sort((a, b) => new Date(a.Ngay_Hen_Tra) - new Date(b.Ngay_Hen_Tra));
    },
  },
  watch: {
    isEditingProfile(newVal) {
      if (newVal && this.currentUser) {
        // Initialize form with current user data when modal opens
        this.editForm = {
          Ho_Lot: this.currentUser.Ho_Lot || '',
          Ten: this.currentUser.Ten || '',
          Ngay_Sinh: this.currentUser.Ngay_Sinh ? this.currentUser.Ngay_Sinh.split('T')[0] : '',
          Phai: this.currentUser.Phai || '',
          Email: this.currentUser.Email || '',
          Dien_Thoai: this.currentUser.Dien_Thoai || '',
          Dia_Chi: this.currentUser.Dia_Chi || '',
        };
      }
    }
  },
  async mounted() {
    try {
      const reader = localStorage.getItem("reader");
      if (reader) {
        this.currentUser = JSON.parse(reader);
        console.log("User loaded:", this.currentUser?.Ho_Lot, this.currentUser?.Ten);
      }
      
      // Reload user data from API to get latest status
      await this.loadUserData();
      
      // Auto-create fine records cho những sách quá hạn
      await this.autoCreateOverdueFines();
      // Tải dữ liệu mượn
      await this.loadBorrowData();
      // Tải tiền phạt từ API
      await this.loadFineData();
      console.log("All data loaded");

      // Socket connection for real-time updates (non-blocking)
      try {
        socketService.connect();
        
        // Listen for borrow updates (when admin processes return)
        socketService.on("borrow:updated", async () => {
          console.log("Real-time: borrow updated");
          await this.autoCreateOverdueFines();
          await this.loadBorrowData();
          await this.loadFineData();
        });
        
        // Listen for fine creation
        socketService.on("fine:created", async () => {
          console.log("Real-time: fine created");
          await this.loadFineData();
        });
        
        // Listen for book updates
        socketService.on("books:updated", async () => {
          console.log("Real-time: books updated");
        });
      } catch (socketError) {
        console.warn("Socket connection failed:", socketError);
      }

      // Subscribe to store changes
      const borrowStore = useBorrowStore();
      this.unsubscribe = borrowStore.$subscribe((mutation, state) => {
        // Refresh when store changes
      });
    } catch (error) {
      console.error("Lỗi mounted:", error);
    }
  },

  beforeUnmount() {
    // Cleanup socket listeners
    try {
      socketService.off("borrow:updated");
      socketService.off("fine:created");
      socketService.off("books:updated");
    } catch (e) {
      console.warn("Socket cleanup error:", e);
    }
    
    // Unsubscribe from store
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    async loadUserData() {
      try {
        const reader = JSON.parse(localStorage.getItem("reader"));
        if (!reader || !reader._id) return;
        
        const response = await axios.get(
          `http://localhost:5000/api/readers/${reader._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        // Update currentUser with latest data from server
        this.currentUser = response.data;
        // Update localStorage so it reflects current status
        localStorage.setItem("reader", JSON.stringify(response.data));
        console.log("User data updated from server. Status:", response.data.Tinh_Trang);
      } catch (error) {
        console.error("Lỗi load user data:", error);
      }
    },
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
        console.log(`   - Created: ${response.data.createdCount}`);
        console.log(`   - Updated: ${response.data.updatedCount}`);
        console.log(`   - Total borrows checked: ${response.data.totalBorrowings}`);
      } catch (error) {
        console.error("Lỗi auto-create fine:", error.response?.data || error.message);
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
              // Tiền phạt = 10,000 VND × Số ngày trễ
              const finePerDay = 10000;
              const fine = daysLate * finePerDay;
              totalOverdueFine += fine;
              console.log(`Borrow ${idx}: ${daysLate} days late, fine: ${fine}`);
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
        console.log(`Fetching fines for reader ID: ${reader._id}`);
        const response = await axios.get(
          `http://localhost:5000/api/fines/unpaid/${reader._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // API trả về { totalFine, count }
        console.log("Fine response data:", response.data);
        this.unpaidFinesTotal = response.data.totalFine || 0;
        console.log(`Tiền phạt đã tải: ${this.unpaidFinesTotal} VND (${response.data.count} phiếu)`);
      } catch (error) {
        console.error("Lỗi tải tiền phạt:", error.response?.data || error.message);
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
    daysUntilReturn(returnDate) {
      const now = new Date();
      const return_date = new Date(returnDate);
      const diffTime = return_date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    },
    async handleRefresh() {
      try {
        this.isRefreshing = true;
        console.log("Manual refresh initiated...");
        
        await this.loadUserData();
        console.log("User data refreshed");
        
        await this.autoCreateOverdueFines();
        console.log("Auto-create fines completed");
        
        await this.loadBorrowData();
        console.log("Borrow data refreshed");
        
        await this.loadFineData();
        console.log("Fine data refreshed");
        
        showToast("Cập nhật dữ liệu thành công!", "success");
      } catch (error) {
        console.error("Error during refresh:", error);
        showToast("Lỗi khi cập nhật dữ liệu", "error");
      } finally {
        this.isRefreshing = false;
      }
    },
    async updateProfile() {
      try {
        // Validate name fields
        if (!this.editForm.Ho_Lot || this.editForm.Ho_Lot.trim().length === 0) {
          showToast("Họ không được để trống!", "error");
          return;
        }

        if (!this.editForm.Ten || this.editForm.Ten.trim().length === 0) {
          showToast("Tên không được để trống!", "error");
          return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.editForm.Email)) {
          showToast("Email không hợp lệ!", "error");
          return;
        }

        // Validate phone
        const phoneRegex = /^\d{10,}$/;
        if (!phoneRegex.test(this.editForm.Dien_Thoai.replace(/\D/g, ''))) {
          showToast("Số điện thoại không hợp lệ (tối thiểu 10 chữ số)!", "error");
          return;
        }

        // Validate address
        if (!this.editForm.Dia_Chi || this.editForm.Dia_Chi.trim().length < 5) {
          showToast("Địa chỉ phải có ít nhất 5 ký tự!", "error");
          return;
        }

        const reader = JSON.parse(localStorage.getItem("reader"));
        const response = await axios.put(
          `http://localhost:5000/api/readers/${reader._id}`,
          {
            Ho_Lot: this.editForm.Ho_Lot.trim(),
            Ten: this.editForm.Ten.trim(),
            Ngay_Sinh: this.editForm.Ngay_Sinh || null,
            Phai: this.editForm.Phai || null,
            Email: this.editForm.Email.trim(),
            Dien_Thoai: this.editForm.Dien_Thoai.trim(),
            Dia_Chi: this.editForm.Dia_Chi.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Update localStorage
        const updatedReader = { ...reader, ...response.data };
        localStorage.setItem("reader", JSON.stringify(updatedReader));
        
        // Update component state
        this.currentUser = updatedReader;
        
        // Close modal
        this.isEditingProfile = false;

        // Show success message
        showToast("Cập nhật thông tin thành công!", "success");
        
      } catch (error) {
        console.error("Lỗi cập nhật thông tin:", error);
        showToast("Cập nhật thông tin thất bại. Vui lòng thử lại!", "error");
      }
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

.btn-tertiary {
  border-color: #4facfe;
  color: #4facfe;
}

.btn-tertiary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.3);
}

.btn-tertiary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Upcoming Return Section */
.upcoming-section {
  background: white;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.upcoming-section h3 {
  font-size: 1.25rem;
  color: #d97706;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.upcoming-books {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upcoming-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.upcoming-item:hover {
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
  transform: translateX(4px);
}

.book-info-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.book-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.return-date {
  font-size: 0.85rem;
  color: #6b7280;
}

.days-left {
  padding: 0.5rem 1rem;
  background: #fbbf24;
  color: #78350f;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  min-width: 80px;
}

.days-left.urgent {
  background: #ef4444;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
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
  margin-bottom: 3rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f4f8;
}

.profile-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0;
  font-weight: 600;
}

.btn-edit-profile {
  padding: 0.625rem 1.25rem;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-edit-profile:hover {
  background: #0b5ed7;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
  transform: translateY(-2px);
}

.profile-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.info-item:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 10px;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-content .label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-content .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
}

.status-active {
  color: #16a34a;
  font-weight: 700;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid #f0f4f8;
}

.modal-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  transition: color 0.3s ease;
}

.btn-close:hover {
  color: #1a202c;
}

.edit-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
}

.required {
  color: #dc3545;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.form-group select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%232d3748' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.875rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f4f8;
}

.btn-submit,
.btn-cancel {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-submit {
  background: #0d6efd;
  color: white;
}

.btn-submit:hover {
  background: #0b5ed7;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
  transform: translateY(-2px);
}

.btn-cancel {
  background: #e2e8f0;
  color: #2d3748;
}

.btn-cancel:hover {
  background: #cbd5e1;
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
