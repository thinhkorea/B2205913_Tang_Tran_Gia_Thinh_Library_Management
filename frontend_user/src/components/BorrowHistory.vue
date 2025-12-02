<template>
  <div class="view-content">
    <!-- Header -->
    <Header 
      title="Lịch Sử Mượn Sách"
      :subtitle="`Tổng số lần mượn: ${borrowStore.myBorrows.length}`"
      :userName="`${currentUser?.Ho_Lot} ${currentUser?.Ten}`"
      :showBack="true"
      @back="$emit('back')"
      @logout="handleLogout"
    />

    <!-- Content Wrapper -->
    <div class="content-wrapper">
      <div class="container">
        <!-- No History State -->
        <div v-if="borrowStore.myBorrows.length === 0" class="no-history">
          <i class="fas fa-inbox"></i>
          <h3>Chưa có lịch sử mượn sách</h3>
          <p>Bạn chưa mượn sách nào từ thư viện. Hãy quay lại để chọn sách mượn!</p>
        </div>

        <!-- Filter & Sort Section -->
        <div v-else class="filter-section">
          <div class="filter-tabs">
            <button 
              @click="filterStatus = null; currentPage = 1"
              :class="['filter-tab', { active: filterStatus === null }]"
            >
              Tất cả ({{ borrowStore.myBorrows.length }})
            </button>
            <button 
              @click="filterStatus = 'Chờ xác nhận'; currentPage = 1"
              :class="['filter-tab', { active: filterStatus === 'Chờ xác nhận' }]"
            >
              Chờ xác nhận ({{ getPendingCount() }})
            </button>
            <button 
              @click="filterStatus = 'Đang mượn'; currentPage = 1"
              :class="['filter-tab', { active: filterStatus === 'Đang mượn' }]"
            >
              Đang mượn ({{ getBorrowingCount() }})
            </button>
            <button 
              @click="filterStatus = 'Quá hạn'; currentPage = 1"
              :class="['filter-tab', { active: filterStatus === 'Quá hạn' }]"
            >
              Quá hạn ({{ getOverdueCount() }})
            </button>
            <button 
              @click="filterStatus = 'Đã trả'; currentPage = 1"
              :class="['filter-tab', { active: filterStatus === 'Đã trả' }]"
            >
              Đã trả ({{ getReturnedCount() }})
            </button>
          </div>
        </div>

        <!-- Books Grid -->
        <div v-if="groupedByDate.length === 0 && borrowStore.myBorrows.length > 0" class="no-history">
          <i class="fas fa-search"></i>
          <h3>Không có phiếu mượn nào</h3>
          <p>Không tìm thấy phiếu mượn với trạng thái này</p>
        </div>

        <div v-else-if="borrowStore.myBorrows.length > 0" class="borrows-by-date">
          <div v-for="dateGroup in paginatedData" :key="dateGroup.date" class="date-group">
            <!-- Date Header -->
            <div class="date-header">
              <h3>{{ formatDateHeader(dateGroup.date) }}</h3>
              <span class="date-count">{{ dateGroup.borrows.length }} sách</span>
            </div>
            
            <!-- Books for this date -->
            <div class="books-in-date">
              <div v-for="borrow in dateGroup.borrows" :key="borrow._id" 
                   :class="['borrow-card', getCardClass(borrow.trang_thai)]">
            
            <!-- Status Badge -->
            <div class="card-header">
              <span :class="['status-badge', getStatusClass(borrow.trang_thai)]">
                {{ getStatusLabel(borrow.trang_thai) }}
              </span>
              <span :class="['days-badge', getDaysRemaining(borrow.Ngay_Hen_Tra, borrow.trang_thai)]">
                {{ getRemainingDays(borrow.Ngay_Hen_Tra, borrow.trang_thai) }}
              </span>
            </div>

            <!-- Book Info -->
            <div class="card-body">
              <div class="book-title">
                <i class="fas fa-book"></i>
                {{ borrow.Ma_Sach?.Ten_Sach || '-' }}
              </div>
              
              <div class="book-details">
                <div class="detail-item">
                  <span class="detail-label">Mã Sách:</span>
                  <span class="detail-value">{{ borrow.Ma_Sach?.Ma_Sach || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tác Giả:</span>
                  <span class="detail-value">{{ borrow.Ma_Sach?.Tac_Gia?.Ten_Tac_Gia || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Ngày Mượn:</span>
                  <span class="detail-value">{{ formatDate(borrow.Ngay_Muon) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Hạn Trả:</span>
                  <span class="detail-value">{{ formatDate(borrow.Ngay_Hen_Tra) || 'Chưa xác định' }}</span>
                </div>
                <div v-if="borrow.Tien_Phat > 0" class="detail-item fine-item">
                  <span class="detail-label">Phí Phạt:</span>
                  <span class="detail-value fine-amount">{{ formatPrice(borrow.Tien_Phat) }}</span>
                </div>
              </div>
            </div>

            <!-- Action -->
            <div class="card-footer">
              <div v-if="borrow.trang_thai === 'Chờ xác nhận'" class="pending-message">
                <i class="fas fa-clock"></i>
                <span>Phiếu mượn đang chờ xác nhận. Hãy liên hệ nhân viên để biết thêm chi tiết.</span>
              </div>
              <div v-else-if="borrow.trang_thai === 'Đang mượn'" class="info-message">
                <i class="fas fa-info-circle"></i>
                <span>Vui lòng liên hệ nhân viên thư viện để trả sách</span>
              </div>
              <div v-else-if="borrow.trang_thai === 'Đã trả'" class="returned-message">
                <i class="fas fa-check-circle"></i>
                <span>Bạn đã trả sách này</span>
              </div>
              <div v-else-if="borrow.trang_thai === 'Quá hạn'" class="overdue-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Sách đang quá hạn trả. Vui lòng trả ngay!</span>
              </div>
            </div>
          </div>
            </div>
            </div>
          </div>

        <!-- Pagination Section -->
        <div v-if="borrowStore.myBorrows.length > 0 && groupedByDate.length > itemsPerPage" class="pagination-section">
          <button
            class="btn-pagination"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="fas fa-chevron-left"></i> Trang trước
          </button>
          
          <span class="pagination-info">
            Trang {{ currentPage }} / {{ totalPages }} ({{ groupedByDate.length }} ngày)
          </span>
          
          <button
            class="btn-pagination"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Trang sau <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- Return Book Modal -->
        <div v-if="showReturnModal" class="modal-overlay" @click="closeReturnModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Trả Sách</h3>
              <button @click="closeReturnModal" class="modal-close">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="modal-body">
              <div class="book-info">
                <div class="info-row">
                  <span class="info-label">Mã Sách:</span>
                  <span class="info-value">{{ selectedBorrow?.Ma_Sach?.Ma_Sach }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tên Sách:</span>
                  <span class="info-value">{{ selectedBorrow?.Ma_Sach?.Ten_Sach }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ngày Mượn:</span>
                  <span class="info-value">{{ formatDate(selectedBorrow?.Ngay_Muon) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Hạn Trả:</span>
                  <span class="info-value">{{ formatDate(selectedBorrow?.Ngay_Hen_Tra) }}</span>
                </div>
              </div>

              <div class="form-group">
                <label for="returnDate" class="form-label">Ngày Trả Thực Tế <span class="required">*</span></label>
                <input 
                  id="returnDate"
                  v-model="returnForm.returnDate" 
                  type="date" 
                  class="form-input"
                  :max="today"
                >
              <small v-if="selectedBorrow && isOverdue(selectedBorrow.Ngay_Hen_Tra, returnForm.returnDate)" 
                     class="overdue-warning">
                Trả muộn {{ getDaysOverdue(selectedBorrow.Ngay_Hen_Tra, returnForm.returnDate) }} ngày
              </small>
            </div>

            <div v-if="calculateFine(selectedBorrow?.Ngay_Hen_Tra, returnForm.returnDate, selectedBorrow?.Ma_Sach?.Don_Gia) > 0" class="fine-section">
              <div class="fine-info">
                <span class="fine-label">Tiền Phạt Quá Hạn:</span>
                <span class="fine-amount">{{ formatPrice(calculateFine(selectedBorrow?.Ngay_Hen_Tra, returnForm.returnDate, selectedBorrow?.Ma_Sach?.Don_Gia)) }}</span>
              </div>
              <small class="fine-detail">{{ getDaysOverdue(selectedBorrow?.Ngay_Hen_Tra, returnForm.returnDate) }} ngày × {{ formatPrice(selectedBorrow?.Ma_Sach?.Don_Gia) }}/ngày</small>
            </div>
            
          </div>

          <div class="modal-footer">
            <button @click="closeReturnModal" class="btn-cancel">
              Hủy
            </button>
            <button 
              @click="handleReturn" 
              class="btn-confirm"
              :disabled="returnLoading">
              <i v-if="returnLoading" class="fas fa-spinner fa-spin"></i>
              {{ returnLoading ? 'Đang Xử Lý...' : 'Xác Nhận Trả Sách' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useBorrowStore } from '../stores/borrowStore';
import { useBookStore } from '../stores/bookStore';
import { useNavigationStore } from '../stores/navigationStore';
import Header from './Header.vue';

export default {
  name: 'BorrowHistory',
  components: {
    Header,
  },
  props: {
    currentUser: {
      type: Object,
      default: () => ({}),
    },
  },
  setup() {
    const borrowStore = useBorrowStore();
    const bookStore = useBookStore();
    const navigationStore = useNavigationStore();
    return { borrowStore, bookStore, navigationStore };
  },
  data() {
    return {
      showReturnModal: false,
      selectedBorrow: null,
      returnForm: {
        returnDate: '',
      },
      returnLoading: false,
      today: new Date().toISOString().split('T')[0],
      filterStatus: null,
      currentPage: 1,
      itemsPerPage: 9,
    };
  },
  mounted() {
    if (this.currentUser && this.currentUser._id) {
      this.borrowStore.loadMyBorrows(this.currentUser._id);
      this.borrowStore.calculateOverdueCount();
      
      // Load saved state from navigationStore
      const state = this.navigationStore.borrowHistoryState;
      if (state) {
        this.filterStatus = state.filterStatus || null;
        this.currentPage = state.currentPage || 1;
      }
    }
  },
  beforeUnmount() {
    // Save state before leaving component
    this.navigationStore.saveBorrowHistoryState({
      filterStatus: this.filterStatus,
      currentPage: this.currentPage,
    });
  },
  computed: {
    groupedByDate() {
      // Filter by status
      let filtered = this.borrowStore.myBorrows;
      if (this.filterStatus !== null) {
        filtered = filtered.filter(b => b.trang_thai === this.filterStatus);
      }
      
      // Sort by Ngay_Muon (newest first)
      const sorted = [...filtered].sort((a, b) => 
        new Date(b.Ngay_Muon) - new Date(a.Ngay_Muon)
      );
      
      const groups = {};
      sorted.forEach(borrow => {
        const date = borrow.Ngay_Muon ? new Date(borrow.Ngay_Muon).toISOString().split('T')[0] : 'unknown';
        if (!groups[date]) {
          groups[date] = { date, borrows: [] };
        }
        groups[date].borrows.push(borrow);
      });
      
      // Return as array
      return Object.values(groups);
    },
    totalPages() {
      return Math.ceil(this.groupedByDate.length / this.itemsPerPage);
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.groupedByDate.slice(start, end);
    },
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    },
    formatDateHeader(dateString) {
      if (!dateString) return 'Không xác định';
      const date = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dateObj = new Date(dateString + 'T00:00:00');
      dateObj.setHours(0, 0, 0, 0);
      
      if (dateObj.getTime() === today.getTime()) {
        return 'Hôm nay (' + dateObj.toLocaleDateString('vi-VN') + ')';
      } else if (dateObj.getTime() === yesterday.getTime()) {
        return 'Hôm qua (' + dateObj.toLocaleDateString('vi-VN') + ')';
      } else {
        return '' + dateObj.toLocaleDateString('vi-VN');
      }
    },
    getRemainingDays(returnDate, status) {
      if (status === 'Đã trả') {
        return 'Đã trả';
      }
      
      if (!returnDate) {
        return 'Chưa xác định';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const deadline = new Date(returnDate);
      deadline.setHours(0, 0, 0, 0);
      
      const diff = deadline - today;
      const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        return `Quá hạn ${Math.abs(daysRemaining)} ngày`;
      } else if (daysRemaining === 0) {
        return 'Hôm nay trả';
      } else {
        return `Còn ${daysRemaining} ngày`;
      }
    },
    getDaysRemaining(returnDate, status) {
      if (status === 'Đã trả' || status === 'Chờ xác nhận') {
        return 'neutral';
      }
      
      if (!returnDate) {
        return 'neutral';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const deadline = new Date(returnDate);
      deadline.setHours(0, 0, 0, 0);
      
      const diff = deadline - today;
      const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        return 'overdue';
      } else if (daysRemaining <= 3) {
        return 'warning';
      } else {
        return 'normal';
      }
    },
    getCardClass(status) {
      if (status === 'Chờ xác nhận') return 'pending';
      if (status === 'Đang mượn') return 'borrowing';
      if (status === 'Đã trả') return 'returned';
      if (status === 'Quá hạn') return 'overdue';
      return 'normal';
    },
    getStatusClass(status) {
      if (status === 'Chờ xác nhận') return 'pending';
      if (status === 'Đang mượn') return 'borrowing';
      if (status === 'Đã trả') return 'returned';
      if (status === 'Quá hạn') return 'overdue';
      return 'normal';
    },
    getStatusLabel(status) {
      const labels = {
        'Chờ xác nhận': 'Chờ xác nhận',
        'Đang mượn': 'Đang mượn',
        'Đã trả': 'Đã trả',
        'Quá hạn': 'Quá hạn'
      };
      return labels[status] || status;
    },
    getPendingCount() {
      return this.borrowStore.myBorrows.filter(b => b.trang_thai === 'Chờ xác nhận').length;
    },
    getBorrowingCount() {
      return this.borrowStore.myBorrows.filter(b => b.trang_thai === 'Đang mượn').length;
    },
    getOverdueCount() {
      return this.borrowStore.myBorrows.filter(b => b.trang_thai === 'Quá hạn').length;
    },
    getReturnedCount() {
      return this.borrowStore.myBorrows.filter(b => b.trang_thai === 'Đã trả').length;
    },
    openReturnModal(borrow) {
      this.selectedBorrow = borrow;
      this.returnForm.returnDate = this.today;
      this.showReturnModal = true;
    },
    closeReturnModal() {
      this.showReturnModal = false;
      this.selectedBorrow = null;
      this.returnForm.returnDate = '';
    },
    isOverdue(deadline, returnDate) {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const returnDateObj = new Date(returnDate);
      returnDateObj.setHours(0, 0, 0, 0);
      return returnDateObj > deadlineDate;
    },
    getDaysOverdue(deadline, returnDate) {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const returnDateObj = new Date(returnDate);
      returnDateObj.setHours(0, 0, 0, 0);
      const diff = returnDateObj - deadlineDate;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },
    calculateFine(deadline, returnDate, bookPrice) {
      if (!deadline || !returnDate || !bookPrice) return 0;
      
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const returnDateObj = new Date(returnDate);
      returnDateObj.setHours(0, 0, 0, 0);
      
      if (returnDateObj <= deadlineDate) {
        return 0; // Không phạt nếu trả đúng hạn
      }
      
      // Tiền phạt = Giá sách × Số ngày trễ
      const daysLate = Math.ceil((returnDateObj - deadlineDate) / (1000 * 60 * 60 * 24));
      return daysLate * bookPrice;
    },
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price || 0);
    },
    async handleReturn() {
      if (!this.selectedBorrow || !this.returnForm.returnDate) {
        this.showError('Vui lòng chọn ngày trả');
        return;
      }

      this.returnLoading = true;
      const bookName = this.selectedBorrow.Ma_Sach?.Ten_Sach;
      const fine = this.calculateFine(
        this.selectedBorrow.Ngay_Hen_Tra, 
        this.returnForm.returnDate,
        this.selectedBorrow.Ma_Sach?.Don_Gia
      );
      
      try {
        const response = await axios.put(
          `http://localhost:5000/api/borrows/${this.selectedBorrow._id}`,
          {
            Ngay_Tra: this.returnForm.returnDate,
            trang_thai: 'Đã trả',
          }
        );

        await this.borrowStore.loadMyBorrows(this.currentUser._id);
        this.borrowStore.calculateOverdueCount();
        await this.bookStore.loadBooks();

        this.closeReturnModal();
        
        let message = `Trả sách "${bookName}" thành công!`;
        if (fine > 0) {
          message += ` Phí phạt quá hạn: ${this.formatPrice(fine)}`;
        }
        this.showSuccess(message);
      } catch (error) {
        console.error('Error returning book:', error);
        this.showError(error.response?.data?.message || 'Không thể trả sách. Vui lòng thử lại');
      } finally {
        this.returnLoading = false;
      }
    },
    showSuccess(message) {
      this.$toast.success(message, { autoClose: 3000 });
    },
    showError(message) {
      this.$toast.error(message, { autoClose: 3000 });
    },
    handleLogout() {
      localStorage.clear();
      this.$emit('logout');
    },
  },
};
</script>

<style scoped>
/* History View */
.view-content {
  animation: fadeIn 0.3s ease-out;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Content Wrapper */
.content-wrapper {
  flex: 1;
  padding: 2rem 0 2rem 0;
  overflow-y: auto;
}

.content-wrapper > * {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  padding: 0 2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* History Section */
.history-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 0 1.5rem 0;
  border-bottom: 2px solid rgba(102, 126, 234, 0.15);
}

.history-header h2 {
  color: #1a1a1a;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.3px;
}

.history-subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0.25rem 0 0 0;
}

.history-subtitle strong {
  color: #667eea;
  font-weight: 600;
}

/* No History State */
.no-history {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  border: 2px dashed rgba(102, 126, 234, 0.25);
  border-radius: 12px;
  padding: 3.5rem 2rem;
  text-align: center;
}

.no-history i {
  font-size: 3.5rem;
  color: #667eea;
  opacity: 0.2;
  margin-bottom: 1rem;
  display: block;
}

.no-history h3 {
  color: #1a1a1a;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.no-history p {
  color: #999;
  margin: 0;
  font-size: 0.95rem;
}

/* Filter Tabs */
.filter-section {
  margin-bottom: 2rem;
}

.filter-tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-tab {
  padding: 0.6rem 1.2rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #666;
  transition: all 0.3s ease;
}

.filter-tab:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-tab.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
}

/* Books History Grid */
.books-history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Borrows by Date */
.borrows-by-date {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.date-group {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.date-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.date-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.books-in-date {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Borrow Card */
.borrow-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;
  display: flex;
  flex-direction: column;
}

.borrow-card:hover {
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.borrow-card.returned {
  border-left-color: #10b981;
  opacity: 0.85;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

/* Card Body */
.card-body {
  padding: 1.25rem;
  flex: 1;
}

.book-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.book-title i {
  color: #667eea;
  margin-top: 2px;
  flex-shrink: 0;
}

/* Book Details */
.book-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  color: #666;
  font-weight: 500;
  min-width: 120px;
}

.detail-value {
  color: #1a1a1a;
  font-weight: 600;
  text-align: right;
}

.detail-item.fine-item {
  background: rgba(239, 68, 68, 0.08);
  padding: 0.5rem;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.detail-item.fine-item .fine-amount {
  color: #ef4444;
  font-weight: 700;
  font-size: 1.05rem;
}

/* Card Footer */
.card-footer {
  padding: 0.75rem 1.25rem 1.25rem;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.9rem;
  font-weight: 500;
}

.pending-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 500;
}

.returned-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  color: #065f46;
  font-size: 0.9rem;
  font-weight: 500;
}

.overdue-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #7f1d1d;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-message i,
.pending-message i,
.returned-message i,
.overdue-message i {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Status & Days Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
}

.status-badge.borrowing {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-badge.returned {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.status-badge.overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.days-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
}

.days-badge.normal {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.days-badge.warning {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.days-badge.overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.days-badge.returned {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.days-badge.neutral {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

/* Buttons */
.btn-return {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  color: white;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-return:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}

.btn-return:active {
  transform: translateY(0);
}

.btn-returned {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.1));
  border: 1px solid rgba(107, 114, 128, 0.3);
  color: #6b7280;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: not-allowed;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #f5f5f7;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Modal Body */
.modal-body {
  padding: 1.5rem;
  background: #f5f5f7;
}

.book-info {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
}

.info-value {
  color: #1a1a1a;
  font-weight: 600;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #1a1a1a;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.overdue-warning {
  display: block;
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.fine-section {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.fine-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.fine-label {
  font-weight: 600;
  color: #92400e;
  font-size: 0.95rem;
}

.fine-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #d97706;
}

.fine-detail {
  display: block;
  color: #b45309;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Modal Footer */
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: white;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel {
  background: #f0f0f0;
  border: none;
  color: #1a1a1a;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast Notifications */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 999;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

.btn-back {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-back:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .books-history-grid {
    grid-template-columns: 1fr;
  }

  .history-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .history-header h2 {
    font-size: 1.4rem;
  }

  .modal-content {
    width: 95%;
  }

  .btn-back {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}

.history-table tbody tr:last-child td {
  border-bottom: none;
}

.history-row {
  transition: all 0.3s ease;
}

.history-row:hover {
  background: rgba(102, 126, 234, 0.05);
}

.history-row.đang\ mượn {
  background: rgba(102, 126, 234, 0.02);
}

.history-row.đã\ trả {
  background: rgba(16, 185, 129, 0.02);
}

.book-id {
  font-weight: 600;
  color: #667eea;
}

.book-name {
  max-width: 300px;
  white-space: normal;
  word-break: break-word;
  font-weight: 500;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.status-badge.borrowing {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.status-badge.returned {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Days Badge */
.days-badge {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.days-badge.normal {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.days-badge.warning {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.days-badge.overdue {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.days-badge.returned {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.days-badge.neutral {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

/* Action Cell */
.action-cell {
  text-align: center;
}

/* Return Button */
.btn-return {
  background: #22c55e;
  border: none;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.btn-return:hover {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-return:active {
  transform: translateY(0);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #f5f5f7;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
  max-height: calc(90vh - 200px);
  overflow-y: auto;
}

.book-info {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  color: #1a1a1a;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.overdue-warning {
  display: block;
  margin-top: 0.5rem;
  color: #fb923c;
  font-size: 0.85rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d0d0d0;
  background: white;
  color: #1a1a1a;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-cancel:hover {
  background: #f0f0f0;
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast Notifications */
.toast {
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  z-index: 2000;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-success {
  background: #22c55e;
  color: white;
  border: 1px solid #16a34a;
}

.toast-error {
  background: #ef4444;
  color: white;
  border: 1px solid #dc2626;
}

@media (max-width: 768px) {
  .books-history-grid {
    grid-template-columns: 1fr;
  }

  .history-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .history-header h2 {
    font-size: 1.4rem;
  }

  .modal-content {
    width: 95%;
  }

  .btn-back {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}

/* Pagination Styles */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  font-weight: 600;
  color: #667eea;
  min-width: 200px;
  text-align: center;
}

.btn-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-pagination:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .pagination-section {
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .pagination-info {
    width: 100%;
  }

  .btn-pagination {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
