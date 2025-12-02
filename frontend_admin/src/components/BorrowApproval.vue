<template>
  <div class="borrow-approval-container">
    <div class="header">
      <h2>Xác nhận phiếu mượn</h2>
      <button @click="refreshPending" class="btn-refresh">
        <span v-if="!loading">Làm mới</span>
        <span v-else>Đang tải...</span>
      </button>
    </div>

    <div v-if="pendingBorrows.length === 0" class="empty-state">
      <p>Không có phiếu mượn chờ xác nhận</p>
    </div>

    <div v-else class="borrows-grid">
      <div
        v-for="borrow in pendingBorrows"
        :key="borrow._id"
        class="borrow-card"
      >
        <div class="card-header">
          <h3>{{ borrow.Ma_Sach?.Ten_Sach }}</h3>
          <span class="status-badge pending">Chờ xác nhận</span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <label>Độc giả:</label>
            <span>{{ `${borrow.Ma_Doc_Gia?.Ho_Lot || ''} ${borrow.Ma_Doc_Gia?.Ten || ''}`.trim() }}</span>
          </div>
          <div class="info-row">
            <label>Email:</label>
            <span>{{ borrow.Ma_Doc_Gia?.Email }}</span>
          </div>
          <div class="info-row">
            <label>Điện thoại:</label>
            <span>{{ borrow.Ma_Doc_Gia?.Dien_Thoai }}</span>
          </div>
          <div class="info-row">
            <label>Tác giả:</label>
            <span>{{ borrow.Ma_Sach?.Tac_Gia?.Ten_Tac_Gia }}</span>
          </div>
          <div class="info-row">
            <label>Ngày mượn:</label>
            <span>{{ formatDate(borrow.Ngay_Muon) }}</span>
          </div>
          <div class="info-row">
            <label>Ngày hẹn trả:</label>
            <span>{{ formatDate(borrow.Ngay_Hen_Tra) }}</span>
          </div>
          <div class="info-row">
            <label>Thời gian yêu cầu:</label>
            <span>{{ formatDateTime(borrow.createdAt) }}</span>
          </div>
        </div>

        <div class="card-footer">
          <button
            @click="approveBorrow(borrow._id)"
            :disabled="actionLoading[borrow._id]"
            class="btn btn-approve"
          >
            <span v-if="!actionLoading[borrow._id]">Xác nhận</span>
            <span v-else>Đang xử lý...</span>
          </button>
          <button
            @click="rejectBorrow(borrow._id)"
            :disabled="actionLoading[borrow._id]"
            class="btn btn-reject"
          >
            <span v-if="!actionLoading[borrow._id]">Từ chối</span>
            <span v-else>Đang xử lý...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { showToast } from "../utils/toast";

export default {
  name: "BorrowApproval",
  data() {
    return {
      pendingBorrows: [],
      loading: false,
      actionLoading: {},
    };
  },
  mounted() {
    this.getPendingBorrows();
    // Tự động làm mới mỗi 30 giây
    this.refreshInterval = setInterval(() => {
      this.getPendingBorrows();
    }, 30000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async getPendingBorrows() {
      try {
        this.loading = true;
        const response = await axios.get(
          "http://localhost:5000/api/borrows/pending"
        );
        this.pendingBorrows = response.data;
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phiếu chờ xác nhận:", error);
        showToast(
          "Lỗi khi lấy danh sách phiếu chờ xác nhận: " + error.message,
          "error"
        );
      } finally {
        this.loading = false;
      }
    },

    async approveBorrow(borrowId) {
      try {
        this.actionLoading[borrowId] = true;
        const response = await axios.post(
          `http://localhost:5000/api/borrows/${borrowId}/approve`
        );
        showToast("Đã xác nhận phiếu mượn", "success");
        this.pendingBorrows = this.pendingBorrows.filter(
          (b) => b._id !== borrowId
        );
      } catch (error) {
        console.error("Lỗi khi xác nhận phiếu mượn:", error);
        showToast(
          "Lỗi khi xác nhận phiếu mượn: " + error.response?.data?.message,
          "error"
        );
      } finally {
        this.actionLoading[borrowId] = false;
      }
    },

    async rejectBorrow(borrowId) {
      if (!confirm("Bạn chắc chắn muốn từ chối phiếu mượn này?")) {
        return;
      }
      try {
        this.actionLoading[borrowId] = true;
        const response = await axios.post(
          `http://localhost:5000/api/borrows/${borrowId}/reject`
        );
        showToast("Đã từ chối phiếu mượn", "success");
        this.pendingBorrows = this.pendingBorrows.filter(
          (b) => b._id !== borrowId
        );
      } catch (error) {
        console.error("Lỗi khi từ chối phiếu mượn:", error);
        showToast(
          "Lỗi khi từ chối phiếu mượn: " + error.response?.data?.message,
          "error"
        );
      } finally {
        this.actionLoading[borrowId] = false;
      }
    },

    refreshPending() {
      this.getPendingBorrows();
    },

    formatDate(date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("vi-VN");
    },

    formatDateTime(date) {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN");
    },
  },
};
</script>

<style scoped>
.borrow-approval-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.btn-refresh {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-refresh:hover:not(:disabled) {
  background: #0056b3;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  color: #999;
  font-size: 16px;
  margin: 0;
}

.borrows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.borrow-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.borrow-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.card-header h3 {
  margin: 0;
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 10px;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.card-body {
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-row label {
  font-weight: 600;
  color: #555;
  min-width: 110px;
}

.info-row span {
  color: #888;
  flex: 1;
  word-break: break-word;
}

.card-footer {
  padding: 15px;
  background: #f8f9fa;
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.3s, transform 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-approve {
  background: #28a745;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background: #218838;
}

.btn-reject {
  background: #dc3545;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background: #c82333;
}
</style>
