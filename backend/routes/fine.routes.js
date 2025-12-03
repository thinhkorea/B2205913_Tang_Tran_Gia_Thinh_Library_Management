import express from "express";
import {
  createFine,
  getAllFines,
  getTotalUnpaidFines,
  updateFineStatus,
  deleteFine,
  autoCreateOverdueFines,
  cleanupOldFines,
  createFineForBorrow,
} from "../controllers/fine.controller.js";

const router = express.Router();

// Lấy tổng tiền phạt chưa thanh toán (specific route before generic get)
router.get("/unpaid/:Ma_Doc_Gia", getTotalUnpaidFines);

// Auto-create fine records cho những sách đang mượn nhưng quá hạn
router.post("/auto-create", autoCreateOverdueFines);

// Cleanup fine cũ (xóa những fine không phải logic mới)
router.post("/cleanup-old", cleanupOldFines);

// Tạo fine cho một borrow cụ thể khi admin trả sách
router.post("/create-for-borrow/:Ma_Muon", createFineForBorrow);

// Tạo mới bản ghi tiền phạt
router.post("/", createFine);

// Lấy danh sách phí phạt
router.get("/", getAllFines);

// Cập nhật trạng thái thanh toán
router.put("/:fineId", updateFineStatus);

// Xóa phí phạt
router.delete("/:fineId", deleteFine);

export default router;
