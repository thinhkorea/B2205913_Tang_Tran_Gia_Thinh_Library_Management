import express from "express";
import {
  getAllBorrows,
  createBorrow,
  updateBorrow,
  deleteBorrow,
  autoUpdateOverdueStatus,
  requestReturn,
  approveBorrow,
  rejectBorrow,
  getPendingBorrows,
} from "../controllers/borrow.controller.js";

const router = express.Router();

// Auto-update overdue status
router.post("/auto-update-overdue", autoUpdateOverdueStatus);

// User request return book(s)
router.post("/request-return", requestReturn);

// Staff/Admin endpoints
router.get("/pending", getPendingBorrows); // Lấy danh sách phiếu chờ xác nhận
router.post("/:id/approve", approveBorrow); // Xác nhận phiếu mượn
router.post("/:id/reject", rejectBorrow); // Hủy phiếu mượn

router.get("/", getAllBorrows);
router.post("/", createBorrow);
router.put("/:id", updateBorrow);
router.delete("/:id", deleteBorrow);

export default router;
