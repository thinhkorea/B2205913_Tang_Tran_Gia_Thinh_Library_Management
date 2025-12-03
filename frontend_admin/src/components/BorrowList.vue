<template>
  <div class="borrow-management">
    <div class="page-header">
      <h2>Quản Lý Mượn Trả Sách</h2>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchTerm"
          type="text" 
          placeholder="Tìm kiếm theo tên độc giả, tên sách..."
          @input="searchBorrows"
        >
      </div>
      <select v-model="statusFilter" @change="filterBorrows" class="filter-select">
        <option value="">Tất cả trạng thái</option>
        <option value="Đang mượn">Đang mượn</option>
        <option value="Đã trả">Đã trả</option>
        <option value="Quá hạn">Quá hạn</option>
      </select>
      <input 
        v-model="borrowDateFilter"
        type="date"
        @change="filterBorrows"
        class="filter-select"
        title="Lọc theo ngày mượn"
      >
    </div>

    <!-- Borrows Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã phiếu mượn</th>
            <th>Tên độc giả</th>
            <th>Tên sách</th>
            <th>Ngày mượn</th>
            <th>Ngày hẹn trả</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="borrow in filteredBorrows" :key="borrow._id">
            <td class="borrow-id">{{ borrow._id.substring(0, 8) }}</td>
            <td class="reader-name">{{ getReaderName(borrow.Ma_Doc_Gia) }}</td>
            <td class="book-title">{{ getBookTitle(borrow.Ma_Sach) }}</td>
            <td>{{ formatDate(borrow.Ngay_Muon) }}</td>
            <td>{{ formatDate(borrow.Ngay_Hen_Tra) }}</td>
            <td>
              <span :class="['status', getStatusClass(borrow)]">
                {{ getStatus(borrow) }}
              </span>
            </td>
            <td class="actions">
              <button @click="editBorrow(borrow)" class="btn-edit" title="Xem chi tiết">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Borrow Modal -->
    <div v-if="showBorrowForm || editingBorrow" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingBorrow ? 'Chi tiết phiếu mượn' : 'Tạo phiếu mượn mới' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        
        <!-- View Mode -->
        <div v-if="editingBorrow" class="modal-view">
          <div class="view-row">
            <div class="view-group">
              <label>Mã phiếu mượn</label>
              <p>{{ editingBorrow._id.substring(0, 12) }}...</p>
            </div>
            <div class="view-group">
              <label>Trạng thái</label>
              <p :class="['status', getStatusClass(editingBorrow)]">{{ getStatus(editingBorrow) }}</p>
            </div>
          </div>
          
          <div class="view-row">
            <div class="view-group">
              <label>Độc giả</label>
              <p>{{ getReaderName(editingBorrow.Ma_Doc_Gia) }}</p>
            </div>
            <div class="view-group">
              <label>Sách</label>
              <p>{{ getBookTitle(editingBorrow.Ma_Sach) }}</p>
            </div>
          </div>
          
          <div class="view-row">
            <div class="view-group">
              <label>Ngày mượn</label>
              <p>{{ formatDate(editingBorrow.Ngay_Muon) }}</p>
            </div>
            <div class="view-group">
              <label>Ngày hẹn trả</label>
              <p>{{ formatDate(editingBorrow.Ngay_Hen_Tra) }}</p>
            </div>
          </div>
          
          <div v-if="editingBorrow.Ngay_Tra" class="view-row">
            <div class="view-group">
              <label>Ngày trả thực tế</label>
              <p>{{ formatDate(editingBorrow.Ngay_Tra) }}</p>
            </div>
            <div class="view-group" v-if="editingBorrow.Tien_Phat > 0">
              <label>Tiền phạt</label>
              <p class="fine-amount">{{ formatPrice(editingBorrow.Tien_Phat) }}</p>
            </div>
          </div>
          
          <div class="modal-actions">
            <button v-if="editingBorrow.trang_thai === 'Đang mượn' || editingBorrow.trang_thai === 'Quá hạn'" @click="openReturnForm" class="btn-success">
              <i class="fas fa-check-circle"></i> Xử Lý Trả Sách
            </button>
            <button @click="closeModal" class="btn-secondary">Đóng</button>
          </div>
        </div>

        <!-- Return Book Form -->
        <div v-if="editingBorrow && showReturnForm" class="modal-view">
          <div class="view-row" style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
            <div class="view-group">
              <label>Ngày trả thực tế</label>
              <p class="return-date-display">{{ formatDate(returnForm.Ngay_Tra) }}</p>
            </div>
          </div>

          <div v-if="returnForm.calculatedFine === 0" class="view-row" style="text-align: center; padding: 2rem;">
            <div class="view-group">
              <h3 style="color: #10b981; margin-bottom: 1rem;">Không có tiền phạt</h3>
              <p style="color: #6b7280; font-size: 1.1rem;">Sách được trả đúng hạn</p>
            </div>
          </div>

          <div v-else class="view-row warning" style="padding: 2rem; text-align: center;">
            <div class="view-group">
              <label style="color: #dc2626; font-weight: 600; font-size: 1.1rem;">Tiền Phạt Quá Hạn</label>
              <p style="color: #dc2626; font-size: 1.8rem; font-weight: 700; margin: 1rem 0;">{{ formatPrice(returnForm.calculatedFine) }}</p>
              <p style="font-size: 0.95rem; color: #92400e;">Trễ {{ returnForm.daysLate }} ngày</p>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="showReturnForm = false" class="btn-secondary">Hủy</button>
            <button @click="submitReturnBook" class="btn-primary">Xác Nhận Trả Sách</button>
          </div>
        </div>
        
        <!-- Create Mode -->
        <form v-if="showBorrowForm" @submit.prevent="submitForm" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>Độc giả</label>
              <select v-model="borrowForm.Ma_Doc_Gia" required>
                <option value="">Chọn độc giả</option>
                <option v-for="reader in readers" :key="reader._id" :value="reader._id">
                  {{ reader.Ho_Lot }} {{ reader.Ten }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Sách</label>
              <select v-model="borrowForm.Ma_Sach" required>
                <option value="">Chọn sách</option>
                <option v-for="book in availableBooks" :key="book._id" :value="book._id">
                  {{ book.Ten_Sach }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Ngày mượn</label>
              <input v-model="borrowForm.Ngay_Muon" type="date" required>
            </div>
            <div class="form-group">
              <label>Ngày hẹn trả</label>
              <input v-model="borrowForm.Ngay_Hen_Tra" type="date" required>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Hủy</button>
            <button type="submit" class="btn-primary">Tạo phiếu</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { success, error, info } from '../utils/toast';
import socketService from '../utils/socket';

export default {
  name: 'BorrowList',
  data() {
    return {
      borrows: [],
      filteredBorrows: [],
      readers: [],
      books: [],
      searchTerm: '',
      statusFilter: '',
      borrowDateFilter: '',
      showBorrowForm: false,
      editingBorrow: null,
      showReturnForm: false,
      borrowForm: {
        Ma_Doc_Gia: '',
        Ma_Sach: '',
        Ngay_Muon: new Date().toISOString().split('T')[0],
        Ngay_Hen_Tra: '',
        Ngay_Tra: '',
        trang_thai: 'Đang mượn'
      },
      returnForm: {
        Ngay_Tra: '',
        calculatedFine: 0,
        daysLate: 0
      },
      pollInterval: null,
    };
  },
  computed: {
    availableBooks() {
      return this.books.filter(book => book.So_Luong > 0);
    }
  },
  async mounted() {
    await this.loadData();
    this.setDefaultReturnDate();
    
    // Connect socket and listen for real-time updates
    try {
      socketService.connect();
      
      socketService.on('borrow:created', async () => {
        console.log('Real-time: borrow created');
        await this.loadBorrows();
      });
      
      socketService.on('borrow:updated', async () => {
        console.log('Real-time: borrow updated');
        await this.loadBorrows();
        await this.loadBooks();
      });
      
      socketService.on('fine:created', async () => {
        console.log('Real-time: fine created');
        await this.loadBorrows();
      });
      
      socketService.on('books:updated', async () => {
        console.log('Real-time: books updated');
        await this.loadBooks();
      });
    } catch (e) {
      console.warn('Socket connection failed:', e);
    }
    
    // Polling backup every 5 seconds (for direct DB changes)
    this.pollInterval = setInterval(async () => {
      // Auto-sync status based on Ngay_Hen_Tra
      await this.autoSyncStatus();
      await this.loadBorrows();
    }, 5000);
  },

  beforeUnmount() {
    // Cleanup socket listeners
    try {
      socketService.off('borrow:created');
      socketService.off('borrow:updated');
      socketService.off('fine:created');
      socketService.off('books:updated');
    } catch (e) {
      console.warn('Socket cleanup error:', e);
    }
    
    // Clear polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  watch: {
    'returnForm.Ngay_Tra'() {
      this.calculateFine();
    }
  },
  methods: {
    async loadData() {
      await this.loadBorrows();
      await this.loadReaders();
      await this.loadBooks();
    },
    
    async autoSyncStatus() {
      try {
        // Gọi API để tự động cập nhật trạng thái dựa trên Ngay_Hen_Tra
        await axios.post('http://localhost:5000/api/borrows/auto-update-overdue');
      } catch (err) {
        // Silent fail - không cần thông báo lỗi cho polling
        console.warn('Auto sync status failed:', err.message);
      }
    },
    
    async loadBorrows() {
      try {
        const response = await axios.get('http://localhost:5000/api/borrows');
        this.borrows = response.data;
        this.filteredBorrows = [...this.borrows];
        console.log('Loaded borrows from DB:', this.borrows);
      } catch (error) {
        console.error('Lỗi tải danh sách mượn trả:', error);
        error('Không thể tải dữ liệu từ cơ sở dữ liệu!');
      }
    },
    
    async loadReaders() {
      try {
        const response = await axios.get('http://localhost:5000/api/readers');
        this.readers = response.data || [];
      } catch (error) {
        console.warn('Lỗi tải danh sách độc giả:', error.message);
        this.readers = [];
      }
    },
    
    async loadBooks() {
      try {
        const response = await axios.get('http://localhost:5000/api/books');
        this.books = response.data || [];
      } catch (error) {
        console.warn('Lỗi tải danh sách sách:', error.message);
        this.books = [];
      }
    },
    
    setDefaultReturnDate() {
      const today = new Date();
      const returnDate = new Date(today);
      returnDate.setDate(today.getDate() + 14); // 2 weeks later
      this.borrowForm.Ngay_Hen_Tra = returnDate.toISOString().split('T')[0];
    },

    openReturnForm() {
      // Set ngày trả về hôm nay (lấy theo múi giờ local)
      this.returnForm.Ngay_Tra = this.getLocalDate();
      this.showReturnForm = true;
    },

    getLocalDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    searchBorrows() {
      this.filterBorrows();
    },
    
    filterBorrows() {
      let filtered = [...this.borrows];
      
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(borrow => {
          const readerName = this.getReaderName(borrow.Ma_Doc_Gia).toLowerCase();
          const bookTitle = this.getBookTitle(borrow.Ma_Sach).toLowerCase();
          return readerName.includes(term) || bookTitle.includes(term);
        });
      }
      
      if (this.statusFilter) {
        filtered = filtered.filter(borrow => {
          const status = this.getStatus(borrow);
          return status === this.statusFilter;
        });
      }

      if (this.borrowDateFilter) {
        filtered = filtered.filter(borrow => {
          const borrowDate = new Date(borrow.Ngay_Muon).toISOString().split('T')[0];
          return borrowDate === this.borrowDateFilter;
        });
      }
      
      this.filteredBorrows = filtered;
    },
    
    getReaderName(readerObj) {
      if (!readerObj) return 'N/A';
      if (typeof readerObj === 'object') {
        return `${readerObj.Ho_Lot || ''} ${readerObj.Ten || ''}`.trim() || 'N/A';
      }
      return 'N/A';
    },
    
    getBookTitle(bookObj) {
      if (!bookObj) return 'N/A';
      if (typeof bookObj === 'object') {
        return bookObj.Ten_Sach || 'N/A';
      }
      return 'N/A';
    },
    
    getStatus(borrow) {
      if (borrow.trang_thai) return borrow.trang_thai;
      
      if (borrow.Ngay_Tra_Thuc_Te) return 'Đã trả';
      
      const today = new Date();
      const dueDate = new Date(borrow.Ngay_Hen_Tra);
      
      if (today > dueDate) return 'Quá hạn';
      return 'Đang mượn';
    },
    
    getStatusClass(borrow) {
      const status = this.getStatus(borrow);
      switch (status) {
        case 'Đã trả': return 'returned';
        case 'Quá hạn': return 'overdue';
        case 'Đang mượn': return 'borrowed';
        default: return '';
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    },

    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price || 0);
    },
    
    async returnBook(borrow) {
      if (!confirm('Xác nhận trả sách này?')) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const updateData = { 
          Ngay_Tra: today,
          trang_thai: 'Đã trả'
        };
        
        await axios.put(`http://localhost:5000/api/borrows/${borrow._id}`, updateData);
        
        const index = this.borrows.findIndex(b => b._id === borrow._id);
        if (index !== -1) {
          this.borrows[index].Ngay_Tra = today;
          this.borrows[index].trang_thai = 'Đã trả';
        }
        
        this.filterBorrows();
        success('Trả sách thành công!');
      } catch (error) {
        console.error('Lỗi trả sách:', error);
        error('Có lỗi xảy ra khi trả sách!');
      }
    },
    
    editBorrow(borrow) {
      this.editingBorrow = borrow;
      this.borrowForm = { ...borrow };
    },
    
    async deleteBorrow(borrowId) {
      if (!confirm('Bạn có chắc chắn muốn xóa phiếu mượn này?')) return;
      
      try {
        await axios.delete(`http://localhost:5000/api/borrows/${borrowId}`);
        this.borrows = this.borrows.filter(b => b._id !== borrowId);
        this.filterBorrows();
        success('Xóa phiếu mượn thành công!');
      } catch (error) {
        console.error('Lỗi xóa phiếu mượn:', error);
        error('Có lỗi xảy ra khi xóa phiếu mượn!');
      }
    },
    
    async submitForm() {
      try {
        // Validate required fields
        if (!this.borrowForm.Ma_Doc_Gia || !this.borrowForm.Ma_Sach) {
          error('Vui lòng chọn độc giả và sách!');
          return;
        }
        
        if (this.editingBorrow) {
          const updateData = {
            Ngay_Tra: this.borrowForm.Ngay_Tra || undefined,
            trang_thai: this.borrowForm.trang_thai || 'Đang mượn'
          };
          // Remove undefined values
          Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
          
          await axios.put(`http://localhost:5000/api/borrows/${this.editingBorrow._id}`, updateData);
          const index = this.borrows.findIndex(b => b._id === this.editingBorrow._id);
          if (index !== -1) {
            this.borrows[index] = { ...this.borrows[index], ...updateData };
          }
        } else {
          const newBorrowData = {
            Ma_Doc_Gia: this.borrowForm.Ma_Doc_Gia,
            Ma_Sach: this.borrowForm.Ma_Sach,
            Ngay_Muon: this.borrowForm.Ngay_Muon,
            Ngay_Tra: this.borrowForm.Ngay_Hen_Tra,
            trang_thai: 'Đang mượn'
          };
          const response = await axios.post('http://localhost:5000/api/borrows', newBorrowData);
          this.borrows.push(response.data);
        }
        
        await this.loadBorrows();
        this.closeModal();
        success(this.editingBorrow ? 'Cập nhật phiếu mượn thành công!' : 'Tạo phiếu mượn thành công!');
      } catch (error) {
        console.error('Lỗi lưu phiếu mượn:', error);
        error('Có lỗi xảy ra khi lưu phiếu mượn: ' + (error.response?.data?.message || error.message));
      }
    },
    
    closeModal() {
      this.showBorrowForm = false;
      this.editingBorrow = null;
      this.showReturnForm = false;
      this.borrowForm = {
        Ma_Doc_Gia: '',
        Ma_Sach: '',
        Ngay_Muon: new Date().toISOString().split('T')[0],
        Ngay_Hen_Tra: '',
        Ngay_Tra: '',
        trang_thai: 'Đang mượn'
      };
      this.returnForm = {
        Ngay_Tra: new Date().toISOString().split('T')[0],
        calculatedFine: 0,
        daysLate: 0
      };
      this.setDefaultReturnDate();
    },

    calculateFine() {
      if (!this.editingBorrow || !this.returnForm.Ngay_Tra) return;

      const dueDate = new Date(this.editingBorrow.Ngay_Hen_Tra);
      dueDate.setHours(0, 0, 0, 0);
      
      const returnDate = new Date(this.returnForm.Ngay_Tra);
      returnDate.setHours(0, 0, 0, 0);

      let daysLate = 0;
      let fine = 0;

      if (returnDate > dueDate) {
        daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        const finePerDay = 10000; // 10,000 VND per day
        fine = daysLate * finePerDay;
      }

      this.returnForm.daysLate = daysLate;
      this.returnForm.calculatedFine = fine;
    },

    async submitReturnBook() {
      try {
        const response = await axios.put(
          `http://localhost:5000/api/borrows/${this.editingBorrow._id}`,
          {
            Ngay_Tra_Thuc_Te: this.returnForm.Ngay_Tra,
            trang_thai: 'Đã trả'
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        success('Trả sách thành công! ' + (this.returnForm.calculatedFine > 0 ? `Tiền phạt: ${this.formatPrice(this.returnForm.calculatedFine)}` : ''));
        
        // Tăng số lượng sách lên 1 sau khi trả
        try {
          const bookId = this.editingBorrow.Ma_Sach?._id || this.editingBorrow.Ma_Sach;
          const book = this.books.find(b => b._id === bookId);
          if (book) {
            await axios.put(
              `http://localhost:5000/api/books/${bookId}`,
              { So_Luong: (book.So_Luong || 0) + 1 },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            console.log(`Số lượng sách đã tăng lên ${book.So_Luong + 1}`);
          }
        } catch (bookErr) {
          console.error('Warning: book quantity update failed:', bookErr);
        }
        
        // Tạo fine record ngay lập tức nếu quá hạn
        try {
          console.log(`Creating fine for borrow ${this.editingBorrow._id}...`);
          const fineResponse = await axios.post(
            `http://localhost:5000/api/fines/create-for-borrow/${this.editingBorrow._id}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          console.log('Fine creation response:', fineResponse.data);
          
          if (fineResponse.data.fineCreated) {
            success(`Phiếu phạt đã tạo: ${this.formatPrice(fineResponse.data.fineAmount)} (quá hạn ${fineResponse.data.daysLate} ngày)`);
          } else if (fineResponse.data.daysLate === 0) {
            console.log('Sách không quá hạn, không phạt');
          }
        } catch (fineErr) {
          console.error('Warning: fine creation failed:', fineErr);
          // Không show error vì trả sách đã thành công, fine có thể tạo lần sau
        }
        
        this.showReturnForm = false;
        this.editingBorrow = null;
        await this.loadBorrows();
        await this.loadBooks(); // Cập nhật số lượng sách ngay
      } catch (error) {
        error('Lỗi khi trả sách: ' + (error.response?.data?.message || error.message));
      }
    }
  }
};
</script>

<style scoped>
.borrow-management {
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fc 0%, #f3f4f8 100%);
  min-height: 100vh;
  color: #1a1a1a;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;
}

.page-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header i {
  color: #667eea;
  font-size: 1.5rem;
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #667eea;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 1rem 1.25rem 1rem 3rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.search-box input::placeholder {
  color: #999999;
}

.filter-select {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.filter-select option {
  color: #1a1a1a;
  background: #ffffff;
}

.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  max-width: 1200px;
  margin: 0 auto 2rem auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.25rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
}

.data-table td {
  padding: 1.25rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;
  color: #333333;
}

.data-table tbody tr {
  transition: all 0.3s ease;
}

.data-table tbody tr:hover {
  background: #f8f9ff;
  box-shadow: inset 0 0 0 1px #e8ebf8;
}

.borrow-id {
  font-weight: 600;
  color: #667eea;
}

.reader-name, .book-title {
  font-weight: 600;
  color: #1a1a1a;
}

.status {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.status.borrowed {
  background: rgba(59, 130, 246, 0.15);
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.status.returned {
  background: rgba(16, 185, 129, 0.15);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status.overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #991b1b;
  border: 1px solid #fecaca;
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-return, .btn-edit, .btn-delete {
  padding: 0.625rem 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.btn-edit:hover {
  background: #1d4ed8;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4);
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.75rem;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fc 0%, #f3f4f8 100%);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: #999999;
  font-size: 1.75rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.3s ease;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.btn-close:hover {
  color: #1a1a1a;
  background: rgba(0, 0, 0, 0.05);
}

.modal-form {
  padding: 2rem;
}

.modal-view {
  padding: 2rem;
}

.view-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.view-row.warning {
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.5), rgba(253, 230, 138, 0.5));
  border: 2px solid #fcd34d;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.fine-amount {
  color: #dc2626 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
}

.return-date-display {
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  font-weight: 600;
  color: #065f46;
  font-size: 1rem;
}

.view-group {
  flex: 1;
}

.view-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #999999;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.view-group p {
  margin: 0;
  color: #1a1a1a;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.75rem 1rem;
  background: #f8f9fc;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.625rem;
  color: #1a1a1a;
  font-size: 0.9rem;
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #1a1a1a;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f8f9fc;
  color: #999999;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn-secondary {
  background: white;
  color: #666666;
  border: 1px solid #e0e0e0;
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #f8f9fc;
  border-color: #667eea;
  color: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .borrow-management {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    padding: 0 0;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .filter-section {
    grid-template-columns: 1fr;
    padding: 0 0;
  }

  .form-row {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-primary, .btn-secondary {
    width: 100%;
  }

  .table-container {
    overflow-x: auto;
    margin: 0 -1rem 2rem -1rem;
    border-radius: 0;
  }

  .data-table {
    min-width: 1000px;
    font-size: 0.85rem;
  }

  .data-table th {
    padding: 1rem;
  }

  .data-table td {
    padding: 0.75rem;
  }

  .actions {
    gap: 0.5rem;
  }

  .modal-content {
    width: 95%;
  }

  .modal-form {
    padding: 1.5rem;
  }
}
</style>
