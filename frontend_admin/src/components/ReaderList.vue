<template>
  <div class="reader-container">
    <!-- Header Section -->
    <div class="header-section">
      <h2>Quản Lý Độc Giả</h2>
      <div class="header-controls">
        <button @click="showAddForm" class="btn-add">
          <i class="fas fa-plus"></i> Thêm Độc Giả
        </button>
        <button @click="toggleFilter" class="btn-filter">
          <i class="fas fa-filter"></i> Bộ Lọc
        </button>
      </div>
    </div>

    <!-- Filter Section -->
    <div v-if="showFilterSection" class="filter-section">
      <div class="filter-row">
        <input 
          v-model="searchTerm"
          type="text"
          placeholder="Tìm kiếm theo mã, tên, SĐT..."
          class="search-input"
          @input="performSearch"
        />
        <select v-model="genderFilter" @change="performSearch" class="filter-select">
          <option value="">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      </div>
    </div>

    <!-- Readers Gallery -->
    <div class="readers-gallery">
      <div v-for="reader in filteredReaders" :key="reader._id" class="reader-card">
        <div class="card-content">
          <div class="reader-header">
            <div class="reader-info">
              <p class="reader-id">{{ reader.Ma_Doc_Gia }}</p>
              <h3 class="reader-name">{{ reader.Ho_Lot }} {{ reader.Ten }}</h3>
            </div>
          </div>

          <div class="reader-details">
            <div class="detail-item">
              <span class="detail-label">Giới tính:</span>
              <span class="detail-value">{{ reader.Phai || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Ngày sinh:</span>
              <span class="detail-value">{{ formatDate(reader.Ngay_Sinh) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Điện thoại:</span>
              <span class="detail-value">{{ reader.Dien_Thoai || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Địa chỉ:</span>
              <span class="detail-value">{{ reader.Dia_Chi || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Trạng thái:</span>
              <span class="detail-value" :class="{ 'status-active': reader.Tinh_Trang === '1', 'status-locked': reader.Tinh_Trang === '0' }">
                {{ reader.Tinh_Trang === '1' ? '✓ Hoạt động' : '✗ Khóa' }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-edit-card" @click="editReader(reader, $event)" title="Chỉnh sửa">
              <i class="fas fa-edit"></i>
            </button>
            <button 
              :class="reader.Tinh_Trang === '1' ? 'btn-lock-card' : 'btn-unlock-card'"
              @click="toggleLockReader(reader._id, reader.Tinh_Trang, $event)" 
              :title="reader.Tinh_Trang === '1' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
            >
              <i :class="reader.Tinh_Trang === '1' ? 'fas fa-lock-open' : 'fas fa-lock'"></i>
            </button>
            <button class="btn-delete-card" @click="deleteReader(reader._id, $event)" title="Xóa">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredReaders.length === 0" class="no-readers">
      <i class="fas fa-user-slash"></i>
      <h3>Không tìm thấy độc giả nào</h3>
      <p>Hãy thêm độc giả mới để bắt đầu</p>
    </div>

    <!-- Form Modal Thêm/Sửa Độc Giả -->
    <div v-if="isFormVisible" class="modal-overlay" @click.self="cancelForm">
      <div class="form-modal">
        <div class="form-header">
          <h3>{{ isEditing ? 'Chỉnh Sửa Độc Giả' : 'Thêm Độc Giả Mới' }}</h3>
          <button @click="cancelForm" class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="reader-form">
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label for="ma-doc-gia">Mã Độc Giả</label>
                <input 
                  id="ma-doc-gia"
                  v-model="formData.Ma_Doc_Gia" 
                  type="text" 
                  required 
                  :disabled="isEditing"
                  :placeholder="isEditing ? 'Không thể thay đổi mã độc giả' : 'VD: DG001'"
                  class="form-input"
                />
                <small v-if="isEditing" class="form-hint">Mã độc giả không thể thay đổi</small>
              </div>
              <div class="form-group">
                <label for="ho-lot">Họ Lót</label>
                <input 
                  id="ho-lot"
                  v-model="formData.Ho_Lot" 
                  type="text" 
                  required 
                  placeholder="Nhập họ lót"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ten">Tên</label>
                <input 
                  id="ten"
                  v-model="formData.Ten" 
                  type="text" 
                  required 
                  placeholder="Nhập tên"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="gioi-tinh">Giới Tính</label>
                <select 
                  id="gioi-tinh"
                  v-model="formData.Phai"
                  class="form-select"
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ngay-sinh">Ngày Sinh</label>
                <input 
                  id="ngay-sinh"
                  v-model="formData.Ngay_Sinh" 
                  type="date" 
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="dien-thoai">Điện Thoại</label>
                <input 
                  id="dien-thoai"
                  v-model="formData.Dien_Thoai" 
                  type="tel" 
                  placeholder="0912345678"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="dia-chi">Địa Chỉ</label>
                <input 
                  id="dia-chi"
                  v-model="formData.Dia_Chi" 
                  type="text" 
                  placeholder="Nhập địa chỉ"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="password">Mật Khẩu</label>
                <input 
                  id="password"
                  v-model="formData.Password" 
                  type="password" 
                  :required="!isEditing"
                  :placeholder="isEditing ? 'Bỏ trống để giữ nguyên' : 'Nhập mật khẩu'"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button 
              type="button" 
              @click="cancelForm" 
              class="btn-cancel" 
              :disabled="isLoading"
            >
              <i class="fas fa-times"></i> Hủy
            </button>
            <button 
              type="submit" 
              class="btn-submit" 
              :disabled="isLoading"
            >
              <i class="fas fa-save" v-if="!isLoading"></i>
              <i class="fas fa-spinner fa-spin" v-if="isLoading"></i>
              {{ isEditing ? "Cập Nhật" : "Thêm Mới" }}
            </button>
          </div>

          <!-- Messages -->
          <div v-if="error" class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>
          <div v-if="success" class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            <span>{{ success }}</span>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
      <div class="delete-modal">
        <div class="delete-modal-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Xác nhận xóa độc giả</h3>
        </div>
        <div class="delete-modal-body">
          <p>Bạn có chắc chắn muốn xóa độc giả:</p>
          <div class="reader-to-delete">
            <strong>{{ readerToDelete?.Ho_Lot }} {{ readerToDelete?.Ten }}</strong>
          </div>
          <p class="warning-text">
            <i class="fas fa-triangle-exclamation"></i>
            Hành động này không thể hoàn tác!
          </p>
        </div>
        <div class="delete-modal-actions">
          <button 
            type="button" 
            @click="cancelDelete" 
            class="btn-cancel-delete"
            :disabled="isLoading"
          >
            <i class="fas fa-times"></i> Hủy
          </button>
          <button 
            type="button" 
            @click="confirmDelete" 
            class="btn-confirm-delete"
            :disabled="isLoading"
          >
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ReaderList',
  data() {
    return {
      readers: [],
      filteredReaders: [],
      searchTerm: '',
      genderFilter: '',
      showFilterSection: false,
      isFormVisible: false,
      isEditing: false,
      editingId: null,
      showDeleteModal: false,
      readerToDelete: null,
      isLoading: false,
      error: '',
      success: '',
      formData: {
        Ma_Doc_Gia: '',
        Ho_Lot: '',
        Ten: '',
        Ngay_Sinh: '',
        Phai: '',
        Dia_Chi: '',
        Dien_Thoai: '',
        Password: ''
      }
    };
  },
  async mounted() {
    await this.loadReaders();
    window.addEventListener('keydown', this.handleEscKey);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEscKey);
  },
  methods: {
    async loadReaders() {
      try {
        this.isLoading = true;
        const response = await axios.get('http://localhost:5000/api/readers');
        this.readers = response.data;
        this.filteredReaders = [...this.readers];
      } catch (error) {
        console.error('Lỗi tải danh sách độc giả:', error);
        this.error = 'Không thể tải danh sách độc giả';
      } finally {
        this.isLoading = false;
      }
    },

    showAddForm() {
      this.isFormVisible = true;
      this.isEditing = false;
      this.editingId = null;
      this.error = '';
      this.success = '';
      this.formData = {
        Ma_Doc_Gia: '',
        Ho_Lot: '',
        Ten: '',
        Ngay_Sinh: '',
        Phai: '',
        Dia_Chi: '',
        Dien_Thoai: '',
        Password: ''
      };
    },

    editReader(reader, event) {
      this.isFormVisible = true;
      this.isEditing = true;
      this.editingId = reader._id;
      this.error = '';
      this.success = '';
      
      // Format date properly for input type="date"
      let ngaySinh = '';
      if (reader.Ngay_Sinh) {
        const date = new Date(reader.Ngay_Sinh);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        ngaySinh = `${year}-${month}-${day}`;
      }
      
      this.formData = {
        Ma_Doc_Gia: reader.Ma_Doc_Gia || '',
        Ho_Lot: reader.Ho_Lot || '',
        Ten: reader.Ten || '',
        Ngay_Sinh: ngaySinh,
        Phai: reader.Phai || '',
        Dia_Chi: reader.Dia_Chi || '',
        Dien_Thoai: reader.Dien_Thoai || '',
        Password: ''
      };
    },

    deleteReader(id, event) {
      const reader = this.readers.find(r => r._id === id);
      this.readerToDelete = reader;
      this.showDeleteModal = true;
    },

    async toggleLockReader(id, currentStatus, event) {
      event.stopPropagation();
      try {
        this.isLoading = true;
        const newStatus = currentStatus === '1' ? '0' : '1';
        const statusText = newStatus === '1' ? 'mở khóa' : 'khóa';
        
        const response = await axios.put(
          `http://localhost:5000/api/readers/${id}`,
          { Tinh_Trang: newStatus },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        
        // Update reader in list
        const readerIndex = this.readers.findIndex(r => r._id === id);
        if (readerIndex !== -1) {
          this.readers[readerIndex].Tinh_Trang = newStatus;
        }
        
        this.performSearch();
        this.success = `Đã ${statusText} tài khoản thành công!`;
        setTimeout(() => {
          this.success = '';
        }, 2000);
      } catch (error) {
        console.error('Lỗi khóa/mở khóa:', error);
        this.error = 'Không thể cập nhật trạng thái tài khoản';
        setTimeout(() => {
          this.error = '';
        }, 3000);
      } finally {
        this.isLoading = false;
      }
    },

    cancelDelete() {
      this.showDeleteModal = false;
      this.readerToDelete = null;
    },

    async confirmDelete() {
      if (!this.readerToDelete) return;

      try {
        this.isLoading = true;
        await axios.delete(`http://localhost:5000/api/readers/${this.readerToDelete._id}`);
        
        this.readers = this.readers.filter(r => r._id !== this.readerToDelete._id);
        this.performSearch();
        
        this.success = `Đã xóa độc giả ${this.readerToDelete.Ho_Lot} ${this.readerToDelete.Ten} thành công!`;
        setTimeout(() => {
          this.success = '';
          this.showDeleteModal = false;
          this.readerToDelete = null;
        }, 2000);
      } catch (error) {
        console.error('Lỗi xóa độc giả:', error);
        this.error = 'Không thể xóa độc giả';
      } finally {
        this.isLoading = false;
      }
    },

    async handleSubmit() {
      try {
        this.isLoading = true;
        this.error = '';
        
        const submitData = { ...this.formData };
        if (this.isEditing && !submitData.Password) {
          delete submitData.Password;
        }

        if (this.isEditing) {
          await axios.put(`http://localhost:5000/api/readers/${this.editingId}`, submitData);
          const index = this.readers.findIndex(r => r._id === this.editingId);
          if (index !== -1) {
            this.readers[index] = { ...this.readers[index], ...submitData };
          }
          this.success = 'Cập nhật độc giả thành công!';
        } else {
          const response = await axios.post('http://localhost:5000/api/readers', submitData);
          this.readers.unshift(response.data);
          this.success = 'Thêm độc giả mới thành công!';
        }

        this.performSearch();
        setTimeout(() => {
          this.cancelForm();
        }, 1500);
      } catch (error) {
        console.error('Lỗi lưu độc giả:', error);
        this.error = error.response?.data?.message || 'Không thể lưu độc giả';
      } finally {
        this.isLoading = false;
      }
    },

    cancelForm() {
      this.isFormVisible = false;
      this.isEditing = false;
      this.editingId = null;
      this.error = '';
      this.success = '';
      this.formData = {
        Ma_Doc_Gia: '',
        Ho_Lot: '',
        Ten: '',
        Ngay_Sinh: '',
        Phai: '',
        Dia_Chi: '',
        Dien_Thoai: '',
        Password: ''
      };
    },

    performSearch() {
      let filtered = [...this.readers];

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(reader => 
          reader.Ma_Doc_Gia.toLowerCase().includes(term) ||
          reader.Ho_Lot?.toLowerCase().includes(term) ||
          reader.Ten?.toLowerCase().includes(term) ||
          reader.Dien_Thoai?.toLowerCase().includes(term)
        );
      }

      if (this.genderFilter) {
        filtered = filtered.filter(reader => reader.Phai === this.genderFilter);
      }

      this.filteredReaders = filtered;
    },

    toggleFilter() {
      this.showFilterSection = !this.showFilterSection;
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
      } catch {
        return '-';
      }
    },

    handleEscKey(event) {
      if (event.key === 'Escape') {
        if (this.isFormVisible) {
          this.cancelForm();
        }
        if (this.showDeleteModal) {
          this.cancelDelete();
        }
      }
    }
  }
};
</script>

<style scoped>
.reader-container {
  padding: 40px 20px;
  background: white;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-section h2 {
  font-size: 32px;
  color: #333;
  margin: 0;
  font-weight: 700;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.btn-add, .btn-filter {
  background: #f0f0f0;
  color: #333;
  border: 2px solid #e0e0e0;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover, .btn-filter:hover {
  background: #e0e0e0;
  border-color: #999;
  transform: translateY(-2px);
}

/* Filter Section */
.filter-section {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid #e0e0e0;
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 15px;
  align-items: center;
}

.search-input, .filter-select {
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: rgba(255,255,255,0.9);
  font-size: 14px;
  color: #333;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Readers Gallery */
.readers-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.reader-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.reader-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(102,126,234,0.15);
}

.card-content {
  padding: 20px;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.reader-info {
  flex: 1;
}

.reader-id {
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
  text-transform: uppercase;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.reader-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.3;
}

.reader-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  padding: 12px;
  background: rgba(102,126,234,0.05);
  border-radius: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  font-weight: 600;
  color: #666;
}

.detail-value {
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 10px;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-edit-card, .btn-delete-card, .btn-lock-card, .btn-unlock-card {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 16px;
}

.btn-edit-card {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.btn-edit-card:hover {
  background: rgba(33, 150, 243, 1);
  color: white;
  transform: scale(1.1);
}

.btn-lock-card {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.btn-lock-card:hover {
  background: rgba(76, 175, 80, 1);
  color: white;
  transform: scale(1.1);
}

.btn-unlock-card {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.btn-unlock-card:hover {
  background: rgba(255, 152, 0, 1);
  color: white;
  transform: scale(1.1);
}

.btn-delete-card {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.btn-delete-card:hover {
  background: rgba(244, 67, 54, 1);
  color: white;
  transform: scale(1.1);
}

.status-active {
  color: #4caf50;
  font-weight: 600;
}

.status-locked {
  color: #ff9800;
  font-weight: 600;
}

.no-readers {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.7);
}

.no-readers i {
  font-size: 64px;
  color: rgba(255,255,255,0.3);
  margin-bottom: 20px;
}

.no-readers h3 {
  font-size: 24px;
  margin: 20px 0 10px 0;
  color: white;
}

.no-readers p {
  font-size: 14px;
  margin: 0;
}

/* Modal Overlay - centered */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Form Modal - floating centered */
.form-modal {
  background: white;
  border-radius: 20px;
  width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  border: 1px solid #e0e0e0;
  animation: modalSlideIn 0.4s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0;
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.btn-close-modal {
  background: none;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 6px;
}

.btn-close-modal:hover {
  color: #333;
  transform: scale(1.1);
}

.reader-form {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.form-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: rgba(255, 255, 255, 0.5);
  flex: 1;
  overflow-y: auto;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

.form-row.full-width {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

.form-input, .form-select {
  padding: 12px 14px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
  color: #333;
}

.form-input::placeholder {
  color: #999;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  background: rgba(249, 249, 249, 0.7);
  border-radius: 0 0 20px 20px;
  flex-shrink: 0;
  margin-top: auto;
}

.btn-submit, .btn-cancel {
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-width: 120px;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e8e8e8;
  color: #555;
  min-width: 100px;
  justify-content: center;
}

.btn-cancel:hover:not(:disabled) {
  background: #d0d0d0;
  transform: translateY(-2px);
}

.btn-cancel:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Alert Messages */
.alert {
  margin-top: 15px;
  padding: 14px 16px;
  border-radius: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-error {
  background: #ffebee;
  color: #d32f2f;
  border-left: 4px solid #d32f2f;
}

.alert-success {
  background: #e8f5e9;
  color: #388e3c;
  border-left: 4px solid #388e3c;
}

/* Delete Modal Styles */
.delete-modal {
  background: rgba(255,255,255,0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.3);
  overflow: hidden;
  animation: modalSlideIn 0.4s ease-out;
  z-index: 1001;
}

.delete-modal-header {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  padding: 20px;
  text-align: center;
}

.delete-modal-header i {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
}

.delete-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.delete-modal-body {
  padding: 30px 25px;
  text-align: center;
  color: #333;
}

.delete-modal-body p {
  margin: 0 0 15px 0;
  font-size: 16px;
  line-height: 1.5;
}

.reader-to-delete {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 15px;
  margin: 20px 0;
  font-size: 18px;
  color: #333;
  border-left: 4px solid #ef4444;
}

.warning-text {
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
  margin-top: 20px;
  margin-bottom: 0;
}

.delete-modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn-cancel-delete, .btn-confirm-delete {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel-delete {
  background: #6b7280;
  color: white;
}

.btn-cancel-delete:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

.btn-confirm-delete {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-confirm-delete:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-confirm-delete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .reader-container {
    padding: 15px;
  }
  
  .header-section {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-controls {
    justify-content: center;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .readers-gallery {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
  }
  
  .form-modal {
    width: 90%;
    max-width: 500px;
  }
}

@media (max-width: 480px) {
  .readers-gallery {
    grid-template-columns: 1fr;
  }
  
  .reader-card {
    margin: 0 auto;
    max-width: 320px;
  }
}
</style>
