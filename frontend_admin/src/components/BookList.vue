<template>
  <div class="book-container">
    <div class="header-section">
      <h2>Quản Lý Sách</h2>
      <div class="header-controls">
        <button class="btn-filter" @click="showFilters = !showFilters">
          <i class="fas fa-filter"></i> Lọc
        </button>
        <button class="btn-add" @click="showAddForm">
          <i class="fas fa-plus"></i> Thêm Sách Mới
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="showFilters" class="filter-section">
      <div class="filter-row">
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Tìm kiếm theo tên sách, tác giả..."
          class="search-input"
        >
        <select v-model="filterPublisher" class="filter-select">
          <option value="">Tất cả nhà xuất bản</option>
          <option v-for="pub in publishers" :key="pub._id" :value="pub._id">
            {{ pub.Ten_NXB }}
          </option>
        </select>
        <select v-model="sortBy" class="filter-select">
          <option value="">Sắp xếp theo</option>
          <option value="ten_asc">Tên A-Z</option>
          <option value="ten_desc">Tên Z-A</option>
          <option value="gia_asc">Giá thấp đến cao</option>
          <option value="gia_desc">Giá cao đến thấp</option>
          <option value="nam_desc">Năm mới nhất</option>
        </select>
      </div>
    </div>

    <!-- Form Modal Thêm/Sửa Sách -->
    <div v-if="isFormVisible" class="modal-overlay" @click.self="cancelForm">
      <div class="form-modal">
        <div class="form-header">
          <h3>{{ isEditing ? 'Chỉnh Sửa Sách' : 'Thêm Sách Mới' }}</h3>
          <button @click="cancelForm" class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
      <form @submit.prevent="handleSubmit" class="book-form">
        <div class="form-section">
          <div class="form-row">
            <div class="form-group">
              <label for="ma-sach">Mã Sách</label>
              <input 
                id="ma-sach"
                v-model="formData.Ma_Sach" 
                type="text" 
                required 
                :disabled="isEditing"
                :placeholder="isEditing ? 'Không thể thay đổi mã sách' : 'VD: SK001'"
                class="form-input"
              />
              <small v-if="isEditing" class="form-hint">Mã sách không thể thay đổi</small>
            </div>
            <div class="form-group">
              <label for="ten-sach">Tên Sách</label>
              <input 
                id="ten-sach"
                v-model="formData.Ten_Sach" 
                type="text" 
                required 
                placeholder="Nhập tên sách"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="gia-tien">Giá Tiền (VNĐ)</label>
              <input 
                id="gia-tien"
                v-model.number="formData.Don_Gia" 
                type="number" 
                required 
                placeholder="0"
                min="0"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="so-quyen">Số Quyển</label>
              <input 
                id="so-quyen"
                v-model.number="formData.So_Quyen" 
                type="number" 
                required 
                placeholder="0"
                min="0"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nam-xuat-ban">Năm Xuất Bản</label>
              <input 
                id="nam-xuat-ban"
                v-model.number="formData.Nam_Xuat_Ban" 
                type="number" 
                required 
                placeholder="2024"
                min="1900"
                :max="new Date().getFullYear()"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="tac-gia">Tác Giả</label>
              <select 
                id="tac-gia"
                v-model="formData.Tac_Gia" 
                required
                class="form-select"
              >
                <option value="">-- Chọn Tác Giả --</option>
                <option v-for="author in authors" :key="author._id" :value="author._id">
                  {{ author.Ten_Tac_Gia }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="nha-xuat-ban">Nhà Xuất Bản</label>
              <select 
                id="nha-xuat-ban"
                v-model="formData.Ma_NXB" 
                required
                class="form-select"
              >
                <option value="">-- Chọn Nhà Xuất Bản --</option>
                <option v-for="pub in publishers" :key="pub._id" :value="pub._id">
                  {{ pub.Ten_NXB }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="hinh-anh">Hình Ảnh Bìa Sách</label>
              <div class="file-input-wrapper">
                <input 
                  id="hinh-anh"
                  ref="fileInput"
                  type="file" 
                  accept="image/*"
                  @change="handleImageSelect"
                  class="file-input"
                />
                <label for="hinh-anh" class="file-input-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  {{ imageFileName || "Chọn ảnh từ máy tính" }}
                </label>
              </div>
              
              <div v-if="imagePreview" class="image-preview-section">
                <div class="image-preview">
                  <img 
                    :src="imagePreview" 
                    alt="Preview" 
                    class="preview-img"
                  />
                </div>
              </div>
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

    <!-- Book Gallery -->
    <div class="books-gallery">
      <div class="book-card" v-for="book in filteredBooks" :key="book._id">
        <div class="book-image">
          <img :src="getImageUrl(book.Hinh_Anh)" 
               :alt="book.Ten_Sach" 
               @error="handleImageError"
               loading="lazy">
          <div class="book-overlay">
            <button class="btn-edit-card" @click="editBook(book, $event)" title="Chỉnh sửa">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete-card" @click="deleteBook(book._id, $event)" title="Xóa">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="book-content">
          <div class="book-header">
            <h3 class="book-title">{{ book.Ten_Sach }}</h3>

          </div>

          <div class="book-meta">
            <p class="book-author">
              <i class="fas fa-user"></i>
              {{ getAuthorName(book.Tac_Gia) }}
            </p>
            <p class="book-year">
              <i class="fas fa-calendar"></i>
              {{ book.Nam_Xuat_Ban }}
            </p>
            <p class="book-publisher">
              <i class="fas fa-building"></i>
              {{ getPublisherName(book.Ma_NXB) }}
            </p>
          </div>



          <div class="book-info">
            <div class="price-section">
              <span class="price">{{ formatPrice(book.Don_Gia) }}</span>
              <span class="stock">
                <i class="fas fa-box"></i>
                {{ book.So_Quyen }} quyển
              </span>
            </div>
            
            <div class="book-stats" v-if="book.Luot_Xem">
              <span class="views">
                <i class="fas fa-eye"></i>
                {{ formatViews(book.Luot_Xem) }}
              </span>
            </div>
          </div>

          <div class="book-code">
            <small>Mã: {{ book.Ma_Sach }}</small>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredBooks.length === 0" class="no-books">
      <i class="fas fa-book-open"></i>
      <h3>Không tìm thấy sách nào</h3>
      <p>Hãy thử điều chỉnh bộ lọc hoặc thêm sách mới</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section">
      <button 
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="btn-pagination btn-prev"
      >
        <i class="fas fa-chevron-left"></i> Trước
      </button>
      
      <div class="pagination-numbers">
        <button 
          v-for="page in totalPages" 
          :key="page"
          @click="goToPage(page)"
          :class="['page-number', { active: currentPage === page }]"
        >
          {{ page }}
        </button>
      </div>
      
      <div class="pagination-info">
        Trang {{ currentPage }} / {{ totalPages }} ({{ totalItems }} sách)
      </div>
      
      <button 
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="btn-pagination btn-next"
      >
        Tiếp <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
      <div class="delete-modal">
        <div class="delete-modal-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Xác nhận xóa sách</h3>
        </div>
        <div class="delete-modal-body">
          <p>Bạn có chắc chắn muốn xóa cuốn sách:</p>
          <div class="book-to-delete">
            <strong>{{ bookToDelete?.Ten_Sach }}</strong>
          </div>
          <p class="warning-text">Hành động này không thể hoàn tác!</p>
        </div>
        <div class="delete-modal-actions">
          <button @click="cancelDelete" class="btn-cancel-delete">
            <i class="fas fa-times"></i> Hủy
          </button>
          <button @click="confirmDelete" class="btn-confirm-delete" :disabled="isLoading">
            <i class="fas fa-trash" v-if="!isLoading"></i>
            <i class="fas fa-spinner fa-spin" v-if="isLoading"></i>
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "BookList",
  data() {
    return {
      books: [],
      publishers: [],
      authors: [],
      isFormVisible: false,
      isEditing: false,
      error: "",
      success: "",
      showFilters: true,
      searchTerm: "",
      filterPublisher: "",
      sortBy: "",
      formData: {
        Ma_Sach: "",
        Ten_Sach: "",
        Don_Gia: null,
        So_Quyen: null,
        Nam_Xuat_Ban: null,
        Tac_Gia: "",
        Ma_NXB: "",
        Hinh_Anh: ""
      },
      editingId: null,
      isLoading: false,
      showDeleteModal: false,
      bookToDelete: null,
      modalPosition: { x: 0, y: 0 },
      imageFile: null,
      imageFileName: "",
      imagePreview: "",
      // Phân trang
      currentPage: 1,
      pageSize: 12,
      totalItems: 0,
      totalPages: 1,
    };
  },
  computed: {
    filteredBooks() {
      let filtered = [...this.books];
      
      // Search filter
      if (this.searchTerm) {
        filtered = filtered.filter(book => {
          const authorName = this.getAuthorName(book.Tac_Gia);
          const publisherName = this.getPublisherName(book.Ma_NXB);
          
          return book.Ten_Sach.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                 authorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                 publisherName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                 book.Ma_Sach.toLowerCase().includes(this.searchTerm.toLowerCase());
        });
      }
      
      // Publisher filter
      if (this.filterPublisher) {
        filtered = filtered.filter(book => {
          const publisherId = book.Ma_NXB && typeof book.Ma_NXB === 'object' 
            ? book.Ma_NXB._id 
            : book.Ma_NXB;
          return publisherId === this.filterPublisher;
        });
      }
      
      // Sort
      if (this.sortBy) {
        filtered.sort((a, b) => {
          switch (this.sortBy) {
            case 'ten_asc':
              return a.Ten_Sach.localeCompare(b.Ten_Sach);
            case 'ten_desc':
              return b.Ten_Sach.localeCompare(a.Ten_Sach);
            case 'gia_asc':
              return a.Don_Gia - b.Don_Gia;
            case 'gia_desc':
              return b.Don_Gia - a.Don_Gia;
            case 'nam_desc':
              return b.Nam_Xuat_Ban - a.Nam_Xuat_Ban;
            default:
              return 0;
          }
        });
      }
      
      return filtered;
    }
  },
  mounted() {
    this.fetchBooks();
    this.fetchPublishers();
    this.fetchAuthors();
    
    // ESC key to close modals
    document.addEventListener('keydown', this.handleEscKey);
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscKey);
  },
  methods: {
    async fetchBooks() {
      try {
        const response = await axios.get("http://localhost:5000/api/books", {
          params: {
            page: this.currentPage,
            limit: this.pageSize,
          }
        });
        
        // Backend trả về { data: [...], pagination: {...} }
        if (response.data.data) {
          this.books = response.data.data;
          const pagination = response.data.pagination;
          this.totalItems = pagination.totalItems;
          this.totalPages = pagination.totalPages;
          this.currentPage = pagination.currentPage;
        } else {
          // Fallback nếu backend chỉ trả về mảng
          this.books = response.data;
        }
        console.log("Loaded books:", this.books);
      } catch (error) {
        console.error("Lỗi tải danh sách sách:", error);
        this.books = [];
      }
    },
    
    async fetchPublishers() {
      try {
        const response = await axios.get("http://localhost:5000/api/publishers");
        this.publishers = response.data;
        console.log("Loaded publishers:", this.publishers);
      } catch (error) {
        console.error("Lỗi tải nhà xuất bản:", error);
        this.publishers = [];
      }
    },
    
    async fetchAuthors() {
      try {
        const response = await axios.get("http://localhost:5000/api/authors");
        this.authors = response.data;
        console.log("Loaded authors:", this.authors);
      } catch (error) {
        console.error("Lỗi tải tác giả:", error);
        this.authors = [];
      }
    },
    
    getAuthorName(author) {
      // Nếu author đã được populate thì trả về tên trực tiếp
      if (author && typeof author === 'object' && author.Ten_Tac_Gia) {
        return author.Ten_Tac_Gia;
      }
      // Nếu chỉ có ID thì tìm trong danh sách authors
      if (author && typeof author === 'string') {
        const foundAuthor = this.authors.find(a => a._id === author);
        return foundAuthor ? foundAuthor.Ten_Tac_Gia : 'Không rõ';
      }
      return 'Không rõ';
    },
    
    getPublisherName(publisher) {
      // Nếu publisher đã được populate thì trả về tên trực tiếp
      if (publisher && typeof publisher === 'object' && publisher.Ten_NXB) {
        return publisher.Ten_NXB;
      }
      // Nếu chỉ có ID thì tìm trong danh sách publishers
      if (publisher && typeof publisher === 'string') {
        const foundPublisher = this.publishers.find(p => p._id === publisher);
        return foundPublisher ? foundPublisher.Ten_NXB : 'Không rõ';
      }
      return 'Không rõ';
    },
    
    showAddForm(event) {
      // Lấy vị trí của nút "Thêm Sách Mới"
      const rect = event.target.getBoundingClientRect();
      this.modalPosition = {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10
      };
      
      this.isFormVisible = true;
      this.isEditing = false;
      this.resetForm();
    },
    
    resetForm() {
      this.formData = {
        Ma_Sach: "",
        Ten_Sach: "",
        Don_Gia: null,
        So_Quyen: null,
        Nam_Xuat_Ban: null,
        Tac_Gia: "",
        Ma_NXB: "",
        Hinh_Anh: ""
      };
      this.editingId = null;
      this.error = "";
      this.success = "";
      this.imageFile = null;
      this.imageFileName = "";
      this.imagePreview = "";
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },
    
    cancelForm() {
      this.isFormVisible = false;
      this.resetForm();
    },
    
    async handleSubmit() {
      // Validation bản cơ
      if (!this.formData.Ten_Sach || !this.formData.Ma_Sach) {
        this.error = "Vui lòng nhập đầy đủ thông tin bắt buộc!";
        return;
      }
      
      if (!this.formData.Tac_Gia || !this.formData.Ma_NXB) {
        this.error = "Vui lòng chọn tác giả và nhà xuất bản!";
        return;
      }
      
      if (!this.formData.Don_Gia || this.formData.Don_Gia <= 0) {
        this.error = "Giá tiền phải lớn hơn 0!";
        return;
      }
      
      if (!this.formData.So_Quyen || this.formData.So_Quyen <= 0) {
        this.error = "Số quyển phải lớn hơn 0!";
        return;
      }
      
      if (this.formData.Nam_Xuat_Ban && (this.formData.Nam_Xuat_Ban < 1900 || this.formData.Nam_Xuat_Ban > new Date().getFullYear() + 1)) {
        this.error = "Năm xuất bản không hợp lệ!";
        return;
      }

      // Kiểm tra ảnh khi thêm mới
      if (!this.isEditing && !this.imageFile) {
        this.error = "Vui lòng chọn hình ảnh bìa sách!";
        return;
      }
      
      try {
        // Hiển thị loading
        this.isLoading = true;
        this.error = "";
        const action = this.isEditing ? "Cập nhật" : "Thêm";
        this.success = `Đang ${action.toLowerCase()} sách...`;
        
        // Tạo FormData để gửi file
        const formDataToSend = new FormData();
        formDataToSend.append("Ma_Sach", this.formData.Ma_Sach);
        formDataToSend.append("Ten_Sach", this.formData.Ten_Sach);
        formDataToSend.append("Don_Gia", this.formData.Don_Gia);
        formDataToSend.append("So_Quyen", this.formData.So_Quyen);
        formDataToSend.append("Nam_Xuat_Ban", this.formData.Nam_Xuat_Ban);
        formDataToSend.append("Tac_Gia", this.formData.Tac_Gia);
        formDataToSend.append("Ma_NXB", this.formData.Ma_NXB);
        
        // Thêm file ảnh nếu có file mới
        if (this.imageFile) {
          formDataToSend.append("Hinh_Anh", this.imageFile);
        } else if (this.isEditing && this.formData.Hinh_Anh) {
          // Nếu edit mà không thay đổi ảnh, giữ ảnh cũ
          // Không append Hinh_Anh, backend sẽ giữ ảnh cũ
        }
        
        if (this.isEditing) {
          await axios.put(
            `http://localhost:5000/api/books/${this.editingId}`,
            formDataToSend,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          this.success = `${action} "${this.formData.Ten_Sach}" thành công!`;
          console.log('Updated book:', this.formData.Ten_Sach);
        } else {
          await axios.post("http://localhost:5000/api/books", formDataToSend, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          this.success = `${action} "${this.formData.Ten_Sach}" thành công!`;
          console.log('Added book:', this.formData.Ten_Sach);
        }
        
        this.isFormVisible = false;
        this.resetForm();
        this.fetchBooks();
        
        setTimeout(() => {
          this.success = "";
        }, 4000);
      } catch (error) {
        console.error('Lỗi lưu sách:', error);
        this.error = error.response?.data?.message || `Lỗi khi ${this.isEditing ? 'cập nhật' : 'thêm'} sách`;
        this.success = "";
        
        setTimeout(() => {
          this.error = "";
        }, 5000);
      } finally {
        this.isLoading = false;
      }
    },
    
    editBook(book, event) {
      // Lấy vị trí của card sách hoặc button edit
      const target = event.target.closest('.book-card') || event.target;
      const rect = target.getBoundingClientRect();
      this.modalPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + 20
      };
      
      this.isFormVisible = true;
      this.isEditing = true;
      this.editingId = book._id;
      this.error = "";
      this.success = "";
      
      // Xử lý dữ liệu đã được populate để lấy ID
      const processedBook = {
        Ma_Sach: book.Ma_Sach || "",
        Ten_Sach: book.Ten_Sach || "",
        Don_Gia: book.Don_Gia || null,
        So_Quyen: book.So_Quyen || null,
        Nam_Xuat_Ban: book.Nam_Xuat_Ban || null,
        Tac_Gia: book.Tac_Gia && typeof book.Tac_Gia === 'object' ? book.Tac_Gia._id : book.Tac_Gia,
        Ma_NXB: book.Ma_NXB && typeof book.Ma_NXB === 'object' ? book.Ma_NXB._id : book.Ma_NXB,
        Hinh_Anh: book.Hinh_Anh || ""
      };
      
      this.formData = processedBook;
      
      // Set preview ảnh cũ
      if (book.Hinh_Anh) {
        this.imagePreview = this.getImageUrl(book.Hinh_Anh);
        this.imageFileName = "Ảnh hiện tại";
      }
      
      console.log('Editing book:', book.Ten_Sach);
    },
    
    deleteBook(id, event) {
      // Lấy vị trí của button delete hoặc card
      const target = event.target.closest('.book-card') || event.target;
      const rect = target.getBoundingClientRect();
      this.modalPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + 20
      };
      
      const book = this.books.find(b => b._id === id);
      this.bookToDelete = book;
      this.showDeleteModal = true;
    },

    cancelDelete() {
      this.showDeleteModal = false;
      this.bookToDelete = null;
    },

    async confirmDelete() {
      if (!this.bookToDelete) return;

      try {
        this.isLoading = true;
        this.error = "";
        
        await axios.delete(`http://localhost:5000/api/books/${this.bookToDelete._id}`);
    
        this.success = `Đã xóa "${this.bookToDelete.Ten_Sach}" thành công!`;
        this.showDeleteModal = false;
        this.bookToDelete = null;
        this.fetchBooks();
        
        setTimeout(() => {
          this.success = "";
        }, 4000);
        
        console.log('Deleted book:', this.bookToDelete?.Ten_Sach);
      } catch (error) {
        console.error('Lỗi xóa sách:', error);
        this.error = `Lỗi khi xóa "${this.bookToDelete?.Ten_Sach}": ${error.response?.data?.message || 'Lỗi không xác định'}`;
        
        setTimeout(() => {
          this.error = "";
        }, 5000);
      } finally {
        this.isLoading = false;
      }
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    },
    
    formatViews(views) {
      if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
      }
      return views.toString();
    },
    
    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/300x400?text=L%E1%BB%97i+%E1%BA%A3nh';
    },
    
    getImageUrl(imagePath) {
      // Nếu là URL (http/https) thì giữ nguyên
      if (imagePath && imagePath.startsWith("http")) {
        return imagePath;
      }
      // Nếu là Base64 thì giữ nguyên
      if (imagePath && imagePath.startsWith("data:")) {
        return imagePath;
      }
      // Nếu là filename thì build URL /uploads/filename
      if (imagePath) {
        return `http://localhost:5000/uploads/${imagePath}`;
      }
      // Nếu không có ảnh thì dùng placeholder
      return 'https://via.placeholder.com/300x400?text=No+Image';
    },
    
    handleImageSelect(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        this.error = "Vui lòng chọn file ảnh!";
        return;
      }
      
      // Kiểm tra kích thước (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = "Kích thước ảnh không được vượt quá 5MB!";
        return;
      }
      
      this.imageFile = file;
      this.imageFileName = file.name;
      this.error = "";
      
      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    previewCurrentBook() {
      if (this.isEditing && this.formData.Ten_Sach) {
        return `Chỉnh sửa: ${this.formData.Ten_Sach}`;
      }
      return 'Thêm sách mới';
    },
    
    previewBook() {
      const previewData = {
        ...this.formData,
        authorName: this.getAuthorName(this.formData.Tac_Gia),
        publisherName: this.getPublisherName(this.formData.Ma_NXB)
      };
      
      const previewWindow = window.open('', '_blank', 'width=600,height=800');
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Xem trước: ${previewData.Ten_Sach}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .preview-card {
              background: white;
              border-radius: 16px;
              padding: 25px;
              max-width: 500px;
              margin: 0 auto;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .preview-image {
              text-align: center;
              margin-bottom: 20px;
            }
            .preview-image img {
              max-width: 200px;
              max-height: 260px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .preview-title {
              font-size: 24px;
              font-weight: 700;
              color: #333;
              margin-bottom: 15px;
              text-align: center;
            }
            .preview-info {
              margin: 10px 0;
              font-size: 16px;
              color: #555;
            }
            .preview-label {
              font-weight: 600;
              color: #333;
            }
            .preview-price {
              font-size: 20px;
              font-weight: 700;
              color: #e91e63;
              text-align: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="preview-card">
            <div class="preview-image">
              <img src="${previewData.Hinh_Anh || 'https://via.placeholder.com/200x260?text=No+Image'}" 
                   alt="${previewData.Ten_Sach}" 
                   onerror="this.src='https://via.placeholder.com/200x260?text=No+Image'">
            </div>
            <div class="preview-title">${previewData.Ten_Sach}</div>
            <div class="preview-info">
              <span class="preview-label">Mã sách:</span> ${previewData.Ma_Sach}
            </div>
            <div class="preview-info">
              <span class="preview-label">Tác giả:</span> ${previewData.authorName}
            </div>
            <div class="preview-info">
              <span class="preview-label">Nhà xuất bản:</span> ${previewData.publisherName}
            </div>
            <div class="preview-info">
              <span class="preview-label">Năm xuất bản:</span> ${previewData.Nam_Xuat_Ban}
            </div>
            <div class="preview-info">
              <span class="preview-label">Số lượng:</span> ${previewData.So_Quyen} quyển
            </div>
            <div class="preview-price">
              ${this.formatPrice(previewData.Don_Gia)}
            </div>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
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
    },

    // Phân trang
    goToPage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.fetchBooks();
      // Cuộn lên đầu trang
      window.scrollTo(0, 0);
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.goToPage(this.currentPage + 1);
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    },
  },
};
</script>

<style scoped>
.book-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fc 0%, #f3f4f8 100%);
  min-height: 100vh;
  color: #1a1a1a;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 2rem;
}

.header-section h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.btn-add, .btn-filter {
  background: #e9ecef;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 0.75rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-add:hover, .btn-filter:hover {
  background: #dee2e6;
  border-color: #adb5bd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Filter Section */
.filter-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 15px;
  align-items: center;
}

.search-input, .filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
  color: #1a1a1a;
  transition: all 0.3s ease;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #adb5bd;
  box-shadow: 0 0 0 3px rgba(173, 181, 189, 0.1);
}

/* Modal Overlay - centered with floating effect */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Form Modal - floating centered style */
.form-modal {
  background: white;
  border-radius: 1rem;
  width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
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

.form-section h3 {
  margin-top: 0;
  color: #1a1a1a;
  font-size: 1.25rem;
  font-weight: 700;
}

/* Book Form Styling */
.book-form {
  padding: 0;
}

.form-section {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1rem;
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
  margin-bottom: 0.625rem;
  color: #1a1a1a;
  font-size: 0.875rem;
}

.label-icon {
  font-size: 16px;
}

.form-input, .form-select {
  padding: 0.75rem 0.875rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background-color: white;
  color: #1a1a1a;
}

.form-input::placeholder {
  color: #adb5bd;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #adb5bd;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(173, 181, 189, 0.1);
}

.form-input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.375rem;
  font-style: italic;
}

/* File Input Styles */
.file-input-wrapper {
  position: relative;
  display: block;
}

.file-input {
  display: none;
}

.file-input-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.25rem;
  border: 2px dashed #adb5bd;
  border-radius: 0.625rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #495057;
  text-align: center;
}

.file-input-label:hover {
  border-color: #6c757d;
  background: #f8f9fa;
  color: #1a1a1a;
}

.file-input-label i {
  font-size: 1.5rem;
}

/* Image Preview */
.image-preview-section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
}

.image-preview {
  width: 100%;
  max-width: 120px;
  aspect-ratio: 2/3;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #dee2e6;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0;
  justify-content: center;
  align-items: center;
  padding: 1.25rem;
  border-top: 1px solid #f0f0f0;
  background: white;
  border-radius: 0 0 1rem 1rem;
}

.btn-submit, .btn-cancel {
  padding: 0.6875rem 1.25rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-submit {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
  min-width: 120px;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0a58ca;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e9ecef;
  color: #495057;
  border-color: #dee2e6;
  min-width: 100px;
  justify-content: center;
}

.btn-cancel:hover:not(:disabled) {
  background: #dee2e6;
  border-color: #adb5bd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn-cancel:disabled {
  opacity: 0.65;
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
  background: #fee2e2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

.alert-success {
  background: #dcfce7;
  color: #16a34a;
  border-left: 4px solid #16a34a;
}

/* Book Gallery */
.books-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 0 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.book-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: #dee2e6;
}

.book-image {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.book-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.book-card:hover .book-image img {
  transform: scale(1.05);
}

.book-overlay {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.book-card:hover .book-overlay {
  opacity: 1;
}

.btn-edit-card, .btn-delete-card {
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  background: white;
}

.btn-edit-card {
  color: #0d6efd;
}

.btn-edit-card:hover {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.btn-delete-card {
  color: #dc3545;
}

.btn-delete-card:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
}

.book-content {
  padding: 1.25rem;
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.book-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.book-badge {
  margin-left: 0.625rem;
}

.book-meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.book-author, .book-year, .book-publisher {
  font-size: 0.813rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.book-description {
  font-size: 0.8125rem;
  color: #6c757d;
  line-height: 1.4;
  margin: 0.75rem 0;
}

.book-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.price-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price {
  font-size: 1.125rem;
  font-weight: 700;
  color: #dc3545;
}

.stock {
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.book-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.views {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.book-code {
  margin-top: 8px;
  text-align: right;
}

.book-code small {
  color: #999;
  font-size: 11px;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

/* No Books State */
.no-books {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.no-books i {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.no-books h3 {
  font-size: 24px;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.no-books p {
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
}

/* Messages */
.error-message, .success-message {
  margin-top: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message,
.success-message {
  display: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .book-container {
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
  
  .books-gallery {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
  }
  
  .book-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .book-badge {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .books-gallery {
    grid-template-columns: 1fr;
  }
  
  .book-card {
    margin: 0 auto;
    max-width: 320px;
  }
}

/* Delete Modal Styles */
.delete-modal {
  background: white;
  border-radius: 1rem;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  overflow: hidden;
  animation: modalSlideIn 0.4s ease-out;
  z-index: 1001;
}

.delete-modal-header {
  background: #dc3545;
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.delete-modal-header i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  display: block;
}

.delete-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.delete-modal-body {
  padding: 1.875rem 1.5rem;
  text-align: center;
  color: #1a1a1a;
}

.delete-modal-body p {
  margin: 0 0 0.9375rem 0;
  font-size: 1rem;
  line-height: 1.5;
}

.book-to-delete {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 0.9375rem;
  margin: 1.25rem 0;
  font-size: 1.125rem;
  color: #1a1a1a;
  border-left: 4px solid #dc3545;
}

.warning-text {
  color: #dc3545;
  font-weight: 600;
  font-size: 0.875rem;
  margin-top: 1.25rem;
}

.delete-modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn-cancel-delete, .btn-confirm-delete {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel-delete {
  background: #e9ecef;
  color: #495057;
  border-color: #dee2e6;
}

.btn-cancel-delete:hover {
  background: #dee2e6;
  border-color: #adb5bd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn-confirm-delete {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-confirm-delete:hover:not(:disabled) {
  background: #bb2d3b;
  border-color: #a02834;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
}

.btn-confirm-delete:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Form Improvements */
.btn-submit:disabled, .btn-cancel:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.error-message i, .success-message i {
  margin-right: 0.5rem;
}

/* Loading Animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Image Preview in Form */
.image-preview {
  margin-top: 10px;
  text-align: center;
}

.image-preview img {
  max-width: 120px;
  max-height: 160px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border: 2px solid #e0e0e0;
  object-fit: cover;
}

/* Form Enhancements */
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

.form-modal form {
  padding: 0;
}

.form-group input:invalid {
  border-color: #ef4444;
}

.form-group input:valid {
  border-color: #10b981;
}

/* Better focus states */
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Validation styling */
.form-group input[type="number"]:invalid,
.form-group select:invalid {
  border-color: #f59e0b;
}

.form-group input[type="url"]:invalid {
  border-color: #f59e0b;
}

/* Pagination */
.pagination-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  margin: 2rem auto;
  max-width: 1200px;
  flex-wrap: wrap;
}

.pagination-info {
  font-weight: 600;
  color: #666;
  font-size: 0.95rem;
  white-space: nowrap;
}

.pagination-numbers {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.page-number {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.page-number:hover {
  background: #f0f0f0;
  border-color: #bbb;
}

.page-number.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.btn-pagination {
  padding: 0.75rem 1.5rem;
  border: 2px solid #0d6efd;
  background: white;
  color: #0d6efd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.btn-pagination:hover:not(:disabled) {
  background: #0d6efd;
  color: white;
  transform: translateY(-2px);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #ccc;
  color: #ccc;
}
</style>
