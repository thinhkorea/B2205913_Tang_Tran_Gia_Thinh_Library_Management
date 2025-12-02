import express from "express";
import upload from "../config/multer.js";
import {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
} from "../controllers/book.controller.js";

const router = express.Router();

// Danh sách tất cả sách
router.get("/", getAllBooks);

// Tìm kiếm sách theo từ khóa (?keyword=java)
router.get("/search", searchBooks);

// Thêm sách mới (với upload ảnh)
router.post("/", upload.single("Hinh_Anh"), createBook);

// Cập nhật sách theo ID (với upload ảnh)
router.put("/:id", upload.single("Hinh_Anh"), updateBook);

// Xóa sách theo ID
router.delete("/:id", deleteBook);

export default router;
