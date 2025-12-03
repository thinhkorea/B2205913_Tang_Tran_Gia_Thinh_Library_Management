<template>
  <div class="staff-management">
    <div class="page-header">
      <h2>Quản Lý Nhân Viên</h2>
      <button @click="showStaffForm = true" class="btn-primary">
        <i class="fas fa-user-plus"></i> Thêm nhân viên
      </button>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchTerm"
          type="text" 
          placeholder="Tìm kiếm theo mã NV, tên, email..."
          @input="searchStaff"
        >
      </div>
      <select v-model="positionFilter" @change="filterStaff" class="filter-select">
        <option value="">Tất cả quyền hạn</option>
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
      </select>
    </div>

    <!-- Staff Grid -->
    <div class="staff-grid">
      <div 
        v-for="staff in filteredStaff" 
        :key="staff.Ma_Nhan_Vien"
        class="staff-card"
      >
        <div class="card-header">
          <div class="avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="staff-info">
            <h3>{{ staff.Ho_Ten }}</h3>
            <span class="position" :class="staff.Role === 'admin' ? 'role-admin-header' : 'role-staff-header'">{{ staff.Role === 'admin' ? 'Admin' : 'Staff' }}</span>
          </div>
          <div class="card-actions">
            <button @click="editStaff(staff)" class="btn-edit">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="deleteStaff(staff.Ma_Nhan_Vien)" class="btn-delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="card-body">
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>Mã NV: {{ staff.Ma_Nhan_Vien }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>Email: {{ staff.Email || 'Chưa cập nhật' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>SĐT: {{ staff.So_Dien_Thoai || 'Chưa cập nhật' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>Địa chỉ: {{ staff.Dia_Chi || 'Chưa cập nhật' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-key"></i>
            <span>
              Quyền hạn: 
              <span class="role-badge" :class="staff.Role === 'admin' ? 'role-admin' : 'role-staff'">
                {{ staff.Role === 'admin' ? 'Admin' : 'Staff' }}
              </span>
            </span>
          </div>
        </div>
        
        <div class="card-footer">
          <div class="status-badge" :class="getStatusClass(staff.Trang_Thai)">
            <i class="fas fa-circle"></i>
            {{ staff.Trang_Thai || 'Hoạt động' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredStaff.length === 0" class="empty-state">
      <i class="fas fa-users-cog"></i>
      <h3>Không tìm thấy nhân viên</h3>
      <p>Thử thay đổi từ khóa tìm kiếm hoặc thêm nhân viên mới</p>
    </div>

    <!-- Staff Modal -->
    <div v-if="showStaffForm || editingStaff" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>Mã nhân viên</label>
              <input 
                v-model="staffForm.Ma_Nhan_Vien" 
                type="text" 
                :disabled="editingStaff"
                required
              >
            </div>
            <div class="form-group">
              <label>Họ tên</label>
              <input v-model="staffForm.Ho_Ten" type="text" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Mật khẩu</label>
              <input v-model="staffForm.Password" type="password" :required="!editingStaff">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="staffForm.Email" type="email">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Số điện thoại</label>
              <input v-model="staffForm.So_Dien_Thoai" type="tel">
            </div>
            <div class="form-group">
              <label>Ngày sinh</label>
              <input v-model="staffForm.Ngay_Sinh" type="date">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Địa chỉ</label>
              <input v-model="staffForm.Dia_Chi" type="text">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Quyền hạn</label>
              <select v-model="staffForm.Role" required>
                <option value="">Chọn quyền hạn</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Hủy</button>
            <button type="submit" class="btn-primary">
              {{ editingStaff ? 'Cập nhật' : 'Thêm mới' }}
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

export default {
  name: 'StaffList',
  data() {
    return {
      staff: [],
      filteredStaff: [],
      searchTerm: '',
      positionFilter: '',
      showStaffForm: false,
      editingStaff: null,
      staffForm: {
        Ma_Nhan_Vien: '',
        Ho_Ten: '',
        Password: '',
        Email: '',
        Dia_Chi: '',
        So_Dien_Thoai: '',
        Ngay_Sinh: '',
        Role: 'staff'
      }
    };
  },
  async mounted() {
    await this.loadStaff();
  },
  methods: {
    async loadStaff() {
      try {
        const response = await axios.get('http://localhost:5000/api/staff');
        this.staff = response.data;
        this.filteredStaff = [...this.staff];
      } catch (error) {
        console.error('Lỗi tải danh sách nhân viên:', error);
        this.staff = [];
        this.filteredStaff = [];
      }
    },
    
    searchStaff() {
      this.filterStaff();
    },
    
    filterStaff() {
      let filtered = [...this.staff];
      
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(staff => 
          staff.Ma_Nhan_Vien.toLowerCase().includes(term) ||
          (staff.Ho_Ten && staff.Ho_Ten.toLowerCase().includes(term)) ||
          (staff.Email && staff.Email.toLowerCase().includes(term)) ||
          (staff.So_Dien_Thoai && staff.So_Dien_Thoai.includes(term))
        );
      }
      
      if (this.positionFilter) {
        filtered = filtered.filter(staff => staff.Role === this.positionFilter);
      }
      
      this.filteredStaff = filtered;
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Chưa cập nhật';
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    },
    
    getStatusClass(status) {
      switch (status) {
        case 'Hoạt động': return 'active';
        case 'Tạm nghỉ': return 'temporary';
        case 'Đã nghỉ': return 'inactive';
        default: return 'active';
      }
    },
    
    editStaff(staff) {
      this.editingStaff = staff;
      this.staffForm = { ...staff };
    },
    
    async deleteStaff(maNV) {
      if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
      
      try {
        await axios.delete(`http://localhost:5000/api/staff/${maNV}`);
        this.staff = this.staff.filter(s => s._id !== maNV);
        this.filterStaff();
        success('Xóa nhân viên thành công!');
      } catch (err) {
        console.error('Lỗi xóa nhân viên:', err);
        error('Có lỗi xảy ra khi xóa nhân viên!');
      }
    },
    
    async submitForm() {
      try {
        if (this.editingStaff) {
          await axios.put(`http://localhost:5000/api/staff/${this.editingStaff._id}`, this.staffForm);
          const index = this.staff.findIndex(s => s._id === this.editingStaff._id);
          this.staff[index] = { ...this.staffForm };
        } else {
          await axios.post('http://localhost:5000/api/staff', this.staffForm);
          this.staff.push({ ...this.staffForm });
        }
        
        this.filterStaff();
        this.closeModal();
        success(this.editingStaff ? 'Cập nhật nhân viên thành công!' : 'Thêm nhân viên thành công!');
      } catch (err) {
        console.error('Lỗi lưu nhân viên:', err);
        error('Có lỗi xảy ra khi lưu nhân viên!');
      }
    },
    
    closeModal() {
      this.showStaffForm = false;
      this.editingStaff = null;
      this.staffForm = {
        Ma_Nhan_Vien: '',
        Ho_Ten: '',
        Password: '',
        Email: '',
        Dia_Chi: '',
        So_Dien_Thoai: '',
        Ngay_Sinh: '',
        Role: 'staff'
      };
    }
  }
};
</script>

<style scoped>
.staff-management {
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fc 0%, #f3f4f8 100%);
  min-height: 100vh;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.staff-management > *:not(.modal-overlay) {
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
  color: #06b6d4;
}

.filter-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
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

.search-box input::placeholder {
  color: #999999;
}

.filter-select {
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  color: #1a1a1a;
  font-size: 0.9rem;
  min-width: 180px;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.staff-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.staff-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2);
  border-color: #06b6d4;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.avatar i {
  font-size: 1.5rem;
  color: #667eea;
}

.staff-info {
  flex: 1;
}

.staff-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.position {
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
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
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.temporary {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.inactive {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.role-admin {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.role-staff {
  background: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

.role-admin-header {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.role-staff-header {
  background: rgba(59, 130, 246, 0.2);
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.status-badge i {
  font-size: 0.5rem;
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
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #1a1a1a;
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group select:focus {
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
  .staff-management {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filter-section {
    flex-direction: column;
  }

  .staff-grid {
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
