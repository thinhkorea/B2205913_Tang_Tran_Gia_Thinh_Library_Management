<template>
  <div class="publisher-management">
    <div class="page-header">
      <h2>Quản Lý Nhà Xuất Bản</h2>
      <button @click="showPublisherForm = true" class="btn-primary">
        <i class="fas fa-plus"></i> Thêm nhà xuất bản
      </button>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchTerm"
          type="text" 
          placeholder="Tìm kiếm nhà xuất bản..."
          @input="searchPublishers"
        >
      </div>
    </div>

    <!-- Publishers Grid -->
    <div class="publishers-grid">
      <div 
        v-for="publisher in filteredPublishers" 
        :key="publisher._id"
        class="publisher-card"
      >
        <div class="card-header">
          <h3>{{ publisher.Ten_NXB }}</h3>
          <div class="card-actions">
            <button @click="editPublisher(publisher)" class="btn-edit">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="deletePublisher(publisher._id)" class="btn-delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="info-item">
            <i class="fas fa-id-card"></i>
            <span>Mã NXB: {{ publisher.Ma_NXB || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>Địa chỉ: {{ publisher.Dia_Chi || 'Chưa cập nhật' }}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="stats">
            <span class="book-count">
              <i class="fas fa-book"></i>
              {{ getBookCount(publisher._id) }} sách
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPublishers.length === 0" class="empty-state">
      <i class="fas fa-building"></i>
      <h3>Không tìm thấy nhà xuất bản</h3>
      <p>Thử thay đổi từ khóa tìm kiếm hoặc thêm nhà xuất bản mới</p>
    </div>

    <!-- Publisher Modal -->
    <div v-if="showPublisherForm || editingPublisher" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingPublisher ? 'Chỉnh sửa nhà xuất bản' : 'Thêm nhà xuất bản mới' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>Mã nhà xuất bản</label>
              <input 
                v-model="publisherForm.Ma_NXB" 
                type="text" 
                :disabled="editingPublisher"
                required
              >
            </div>
            <div class="form-group">
              <label>Tên nhà xuất bản</label>
              <input v-model="publisherForm.Ten_NXB" type="text" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Địa chỉ</label>
              <input v-model="publisherForm.Dia_Chi" type="text">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Số điện thoại</label>
              <input v-model="publisherForm.Dien_Thoai" type="tel">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="publisherForm.Email" type="email">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Hủy</button>
            <button type="submit" class="btn-primary">
              {{ editingPublisher ? 'Cập nhật' : 'Thêm mới' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { success, error } from '../utils/toast';
import socketService from '../utils/socket';

export default {
  name: 'PublisherList',
  data() {
    return {
      publishers: [],
      filteredPublishers: [],
      books: [],
      searchTerm: '',
      showPublisherForm: false,
      editingPublisher: null,
      publisherForm: {
        Ma_NXB: '',
        Ten_NXB: '',
        Dia_Chi: '',
        Dien_Thoai: '',
        Email: ''
      },
      pollInterval: null,
    };
  },
  async mounted() {
    await this.loadData();
    
    // Socket connection for real-time updates
    try {
      socketService.connect();
      
      socketService.on('books:updated', async () => {
        console.log('Real-time: books updated');
        await this.loadBooks();
      });
    } catch (e) {
      console.warn('Socket connection failed:', e);
    }
    
    // Polling backup every 5 seconds
    this.pollInterval = setInterval(async () => {
      await this.loadBooks();
    }, 3000);
  },
  beforeUnmount() {
    // Cleanup socket listeners
    try {
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
  methods: {
    async loadData() {
      await Promise.all([
        this.loadPublishers(),
        this.loadBooks()
      ]);
    },
    
    async loadPublishers() {
      try {
        const response = await axios.get('http://localhost:5000/api/publishers');
        this.publishers = response.data;
        this.filteredPublishers = [...this.publishers];
      } catch (error) {
        console.error('Lỗi tải danh sách nhà xuất bản:', error);
        this.publishers = [];
        this.filteredPublishers = [];
      }
    },
    
    async loadBooks() {
      try {
        const response = await axios.get('http://localhost:5000/api/books?limit=1000');
        // Books API returns { data: [...], pagination: {...} }
        this.books = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Lỗi tải danh sách sách:', error);
        this.books = [];
      }
    },
    
    searchPublishers() {
      if (!this.searchTerm) {
        this.filteredPublishers = [...this.publishers];
        return;
      }
      
      const term = this.searchTerm.toLowerCase();
      this.filteredPublishers = this.publishers.filter(publisher =>
        (publisher.Ma_NXB && publisher.Ma_NXB.toLowerCase().includes(term)) ||
        (publisher.Ten_NXB && publisher.Ten_NXB.toLowerCase().includes(term)) ||
        (publisher.Dia_Chi && publisher.Dia_Chi.toLowerCase().includes(term))
      );
    },
    
    getBookCount(publisherId) {
      return this.books.filter(book => {
        const bookPublisherId = book.Ma_NXB && typeof book.Ma_NXB === 'object' 
          ? book.Ma_NXB._id 
          : book.Ma_NXB;
        return bookPublisherId === publisherId;
      }).length;
    },
    
    editPublisher(publisher) {
      this.editingPublisher = publisher;
      this.publisherForm = { ...publisher };
    },
    
    async deletePublisher(publisherId) {
      const bookCount = this.getBookCount(publisherId);
      
      if (bookCount > 0) {
        error(`Không thể xóa nhà xuất bản này vì còn ${bookCount} sách đang sử dụng!`);
        return;
      }
      
      if (!confirm('Bạn có chắc chắn muốn xóa nhà xuất bản này?')) return;
      
      try {
        await axios.delete(`http://localhost:5000/api/publishers/${publisherId}`);
        this.publishers = this.publishers.filter(p => p._id !== publisherId);
        this.searchPublishers();
        success('Xóa nhà xuất bản thành công!');
      } catch (err) {
        console.error('Lỗi xóa nhà xuất bản:', err);
        error('Có lỗi xảy ra khi xóa nhà xuất bản!');
      }
    },
    
    async submitForm() {
      try {
        if (this.editingPublisher) {
          await axios.put(`http://localhost:5000/api/publishers/${this.editingPublisher._id}`, this.publisherForm);
          const index = this.publishers.findIndex(p => p._id === this.editingPublisher._id);
          this.publishers[index] = { ...this.publisherForm, _id: this.editingPublisher._id };
        } else {
          const response = await axios.post('http://localhost:5000/api/publishers', this.publisherForm);
          this.publishers.push(response.data);
        }
        
        this.searchPublishers();
        this.closeModal();       success(this.editingPublisher ? 'Cập nhật nhà xuất bản thành công!' : 'Thêm nhà xuất bản thành công!');
      } catch (err) {
        console.error('Lỗi lưu nhà xuất bản:', err);
        error('Có lỗi xảy ra khi lưu nhà xuất bản!');
      }
    },
    
    closeModal() {
      this.showPublisherForm = false;
      this.editingPublisher = null;
      this.publisherForm = {
        Ma_NXB: '',
        Ten_NXB: '',
        Dia_Chi: '',
        Dien_Thoai: '',
        Email: ''
      };
    }
  }
};
</script>

<style scoped>
.publisher-management {
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fc 0%, #f3f4f8 100%);
  min-height: 100vh;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.publisher-management > *:not(.modal-overlay) {
  max-width: 1400px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.page-header i {
  margin-right: 0.5rem;
  color: #667eea;
}

.search-section {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #667eea;
}

.search-box input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  color: #1a1a1a;
  font-size: 0.9rem;
}

.publishers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.publisher-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.publisher-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
  margin-right: 1rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.btn-edit:hover {
  background: #f59e0b;
  color: white;
}

.btn-delete {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
}

.card-body {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.info-item i {
  width: 20px;
  margin-right: 0.75rem;
  color: #667eea;
}

.info-item span {
  color: #1a1a1a;
  line-height: 1.4;
}

.card-footer {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.book-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #374151;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.btn-primary {
  background: #f0f0f0;
  color: #1a1a1a;
  border: 2px solid #e0e0e0;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary i {
  color: #667eea;
  font-size: 1.1em;
}

.btn-primary:hover {
  background: #e0e0e0;
  border-color: #999;
  transform: translateY(-2px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  margin: 0;
  padding: 0;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
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
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.3s ease;
}

.btn-close:hover {
  color: #333;
}

.modal-form {
  padding: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #1a1a1a;
  font-size: 0.9rem;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid #374151;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(107, 114, 128, 0.3);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .publisher-management {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .publishers-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>