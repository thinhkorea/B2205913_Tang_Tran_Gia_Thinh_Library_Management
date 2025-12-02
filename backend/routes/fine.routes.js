import express from "express";
import {
  getAllFines,
  getTotalUnpaidFines,
  updateFineStatus,
  deleteFine,
  autoCreateOverdueFines,
} from "../controllers/fine.controller.js";

const router = express.Router();

// Auto-create fine records cho những sách đang mượn nhưng quá hạn
router.post("/auto-create", autoCreateOverdueFines);

// Lấy danh sách phí phạt
router.get("/", getAllFines);

// Lấy tổng tiền phạt chưa thanh toán
router.get("/unpaid/:Ma_Doc_Gia", getTotalUnpaidFines);

// Cập nhật trạng thái thanh toán
router.put("/:fineId", updateFineStatus);

// Xóa phí phạt
router.delete("/:fineId", deleteFine);

export default router;
