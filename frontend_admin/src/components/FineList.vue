<template>
  <div class="fine-management">
    <div class="page-header">
      <h2>Quản Lý Tiền Phạt</h2>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchTerm"
          type="text" 
          placeholder="Tìm kiếm theo tên độc giả, tên sách..."
          @input="searchFines"
        >
      </div>
      <select v-model="statusFilter" @change="filterFines" class="filter-select">
        <option value="">Tất cả trạng thái</option>
        <option value="Chưa thanh toán">Chưa thanh toán</option>
        <option value="Đã thanh toán">Đã thanh toán</option>
      </select>
    </div>

    <!-- Fines Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã phạt</th>
            <th>Độc giả</th>
            <th>Sách</th>
            <th>Tiền Phạt</th>
            <th>Số Ngày Trễ</th>
            <th>Trạng Thái</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fine in filteredFines" :key="fine._id">
            <td class="fine-id">{{ fine._id.substring(0, 8) }}</td>
            <td class="reader-name">{{ getReaderName(fine.Ma_Doc_Gia) }}</td>
            <td class="book-title">{{ getBookTitle(fine.Ma_Sach) }}</td>
            <td class="fine-amount">{{ formatPrice(fine.Tong_Tien) }}</td>
            <td class="days-late">{{ fine.So_Ngay_Tre }} ngày</td>
            <td>
              <span :class="['status', getStatusClass(fine)]">
                {{ fine.Trang_Thai_Thanh_Toan }}
              </span>
            </td>
            <td class="actions">
              <button v-if="fine.Trang_Thai_Thanh_Toan === 'Chưa thanh toán'" @click="editFine(fine)" class="btn-edit" title="Xem chi tiết">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteFine(fine._id)" class="btn-delete" title="Xóa">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Fine Modal -->
    <div v-if="editingFine" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Cập Nhật Trạng Thái Thanh Toán</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        
        <div class="modal-view">
          <div class="view-row">
            <div class="view-group">
              <label>Độc giả</label>
              <p>{{ getReaderName(editingFine.Ma_Doc_Gia) }}</p>
            </div>
            <div class="view-group">
              <label>Sách</label>
              <p>{{ getBookTitle(editingFine.Ma_Sach) }}</p>
            </div>
          </div>

          <div class="view-row">
            <div class="view-group">
              <label>Tiền Phạt Gốc</label>
              <p class="fine-amount-text">{{ formatPrice(editingFine.Tong_Tien) }}</p>
            </div>
            <div class="view-group">
              <label>Số Ngày Trễ</label>
              <p>{{ editingFine.So_Ngay_Tre }} ngày</p>
            </div>
          </div>

          <div class="view-row">
            <div class="view-group">
              <label>Số Tiền Cần Thanh Toán</label>
              <input v-model.number="editingFine.Tong_Tien" type="number" min="0" class="input-fine">
            </div>
            <div class="view-group">
              <label>Trạng Thái Thanh Toán</label>
              <select v-model="editingFine.Trang_Thai_Thanh_Toan" class="input-status">
                <option value="Chưa thanh toán">Chưa thanh toán</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeModal" class="btn-secondary">Hủy</button>
            <button @click="updateFine" class="btn-primary">Cập Nhật</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { success, error } from '../utils/toast';
import socketService from '../utils/socket';

export default {
  name: 'FineList',
  data() {
    return {
      fines: [],
      filteredFines: [],
      readers: [],
      books: [],
      searchTerm: '',
      statusFilter: '',
      editingFine: null,
      pollInterval: null,
    };
  },
  async mounted() {
    await this.loadData();

    // Connect socket and listen for real-time updates
    try {
      socketService.connect();
      
      socketService.on('fine:created', async () => {
        console.log('Real-time: fine created');
        await this.loadFines();
      });
      
      socketService.on('borrow:updated', async () => {
        console.log('Real-time: borrow updated');
        await this.loadFines();
      });
    } catch (e) {
      console.warn('Socket connection failed:', e);
    }
    
    // Polling backup every 5 seconds (for direct DB changes)
    this.pollInterval = setInterval(async () => {
      // Auto-create fines for overdue books
      await this.autoCreateFines();
      await this.loadFines();
    }, 3000);
  },

  beforeUnmount() {
    // Cleanup socket listeners
    try {
      socketService.off('fine:created');
      socketService.off('borrow:updated');
    } catch (e) {
      console.warn('Socket cleanup error:', e);
    }
    
    // Clear polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  methods: {
    async autoCreateFines() {
      try {
        // Gọi API để tự động tạo tiền phạt cho sách quá hạn
        await axios.post('http://localhost:5000/api/fines/auto-create', {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (err) {
        // Silent fail - không cần thông báo lỗi cho polling
        console.warn('Auto create fines failed:', err.message);
      }
    },
    async loadData() {
      await this.loadFines();
      await this.loadReaders();
      await this.loadBooks();
    },
    async loadFines() {
      try {
        const response = await axios.get('http://localhost:5000/api/fines', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.fines = response.data || [];
        this.filteredFines = this.fines;
      } catch (err) {
        error('Lỗi khi tải danh sách tiền phạt: ' + err.message);
      }
    },
    async loadReaders() {
      try {
        const response = await axios.get('http://localhost:5000/api/readers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.readers = response.data || [];
      } catch (error) {
        console.error('Lỗi tải độc giả:', error);
      }
    },
    async loadBooks() {
      try {
        const response = await axios.get('http://localhost:5000/api/books', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.books = response.data || [];
      } catch (error) {
        console.error('Lỗi tải sách:', error);
      }
    },
    searchFines() {
      this.filterFines();
    },
    filterFines() {
      this.filteredFines = this.fines.filter(fine => {
        const matchesSearch = 
          this.getReaderName(fine.Ma_Doc_Gia).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getBookTitle(fine.Ma_Sach).toLowerCase().includes(this.searchTerm.toLowerCase());
        
        const matchesStatus = !this.statusFilter || fine.Trang_Thai_Thanh_Toan === this.statusFilter;
        
        return matchesSearch && matchesStatus;
      });
    },
    getReaderName(reader) {
      if (!reader) return 'N/A';
      if (typeof reader === 'string') {
        const found = this.readers.find(r => r._id === reader);
        return found ? `${found.Ho_Lot} ${found.Ten}` : 'N/A';
      }
      return `${reader.Ho_Lot} ${reader.Ten}`;
    },
    getBookTitle(book) {
      if (!book) return 'N/A';
      if (typeof book === 'string') {
        const found = this.books.find(b => b._id === book);
        return found ? found.Ten_Sach : 'N/A';
      }
      return book.Ten_Sach;
    },
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price || 0);
    },
    getStatusClass(fine) {
      return fine.Trang_Thai_Thanh_Toan === 'Đã thanh toán' ? 'paid' : 'unpaid';
    },
    editFine(fine) {
      this.editingFine = JSON.parse(JSON.stringify(fine));
    },
    closeModal() {
      this.editingFine = null;
    },
    async updateFine() {
      try {
        await axios.put(
          `http://localhost:5000/api/fines/${this.editingFine._id}`,
          {
            Trang_Thai_Thanh_Toan: this.editingFine.Trang_Thai_Thanh_Toan,
            Tong_Tien: this.editingFine.Tong_Tien
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        success('Cập nhật tiền phạt thành công!');
        this.closeModal();
        await this.loadFines();
      } catch (err) {
        error('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
      }
    },
    async deleteFine(fineId) {
      if (!confirm('Bạn chắc chắn muốn xóa tiền phạt này?')) return;

      try {
        await axios.delete(
          `http://localhost:5000/api/fines/${fineId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        success('Xóa tiền phạt thành công!');
        await this.loadFines();
      } catch (err) {
        error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
      }
    }
  }
};
</script>

<style scoped>
/* Container */
.fine-management {
  padding: 2rem;
  background: white;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  color: #333;
}

.page-header h2 {
  margin: 0;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Filter Section */
.filter-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 12px;
  color: #999;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  color: #2d3748;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.fine-id {
  font-family: monospace;
  color: #667eea;
  font-weight: 600;
}

.fine-amount {
  color: #dc2626;
  font-weight: 700;
  font-size: 1.05rem;
}

.days-late {
  color: #f59e0b;
  font-weight: 600;
}

.status {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.status.paid {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status.unpaid {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.btn-edit:hover {
  background: #1d4ed8;
  color: white;
}

.btn-delete {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
}

/* Modal */
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-view {
  padding: 2rem;
}

.view-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.view-group {
  flex: 1;
}

.view-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #999;
  font-size: 0.85rem;
  font-weight: 600;
}

.view-group p {
  margin: 0;
  color: #2d3748;
  padding: 0.75rem 1rem;
  background: #f8f9fc;
  border-radius: 6px;
}

.fine-amount-text {
  color: #dc2626 !important;
  font-weight: 700 !important;
}

.input-fine, .input-status {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.input-fine:focus, .input-status:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #f0f0f0;
  color: #1a1a1a;
  border: 2px solid #e0e0e0;
}

.btn-primary i {
  color: #667eea;
  margin-right: 6px;
}

.btn-primary:hover {
  background: #e0e0e0;
  border-color: #999;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #e9ecef;
  color: #2d3748;
}

.btn-secondary:hover {
  background: #d9dfe0;
}
</style>
