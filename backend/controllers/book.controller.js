import Book from "../models/book.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm chuyển file thành Base64
const fileToBase64 = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const base64String = fileBuffer.toString("base64");
  const mimeType = getMimeType(filePath);
  return `data:${mimeType};base64,${base64String}`;
};

// Hàm lấy filename từ file path
const getFilename = (filePath) => {
  return path.basename(filePath);
};

// Hàm lấy MIME type từ extension
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "image/jpeg";
};

// Lấy danh sách tất cả sách (kèm thông tin NXB và tác giả)
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .populate("Ma_NXB") // lấy luôn thông tin NXB
      .populate("Tac_Gia"); // lấy luôn thông tin tác giả
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách sách", error });
  }
};

// Thêm sách mới
export const createBook = async (req, res) => {
  try {
    let bookData = { ...req.body };

    // Nếu có file upload
    if (req.file) {
      const filename = getFilename(req.file.path);
      bookData.Hinh_Anh = filename; // Chỉ lưu filename, không lưu Base64
    }

    const newBook = await Book.create(bookData);
    res.status(201).json(newBook);
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Lỗi xóa file:", err);
      });
    }
    res.status(400).json({ message: "Lỗi khi thêm sách", error });
  }
};

// Cập nhật thông tin sách
export const updateBook = async (req, res) => {
  try {
    let updateData = { ...req.body };
    const oldBook = await Book.findById(req.params.id);

    // Nếu có file upload mới
    if (req.file) {
      const filename = getFilename(req.file.path);
      updateData.Hinh_Anh = filename; // Chỉ lưu filename

      // Xóa file ảnh cũ nếu tồn tại
      if (oldBook && oldBook.Hinh_Anh && !oldBook.Hinh_Anh.startsWith("http") && !oldBook.Hinh_Anh.startsWith("data:")) {
        const oldFilePath = path.join(__dirname, "../uploads", oldBook.Hinh_Anh);
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Lỗi xóa file cũ:", err);
        });
      }
    } else {
      // Nếu không có file mới, giữ ảnh cũ
      if (oldBook && oldBook.Hinh_Anh) {
        updateData.Hinh_Anh = oldBook.Hinh_Anh;
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedBook)
      return res
        .status(404)
        .json({ message: "Không tìm thấy sách để cập nhật" });

    res.status(200).json(updatedBook);
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Lỗi xóa file:", err);
      });
    }
    res.status(400).json({ message: "Lỗi khi cập nhật sách", error });
  }
};

// Xóa sách
export const deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook)
      return res.status(404).json({ message: "Không tìm thấy sách để xóa" });
    res.status(200).json({ message: "Đã xóa sách thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa sách", error });
  }
};

// Tìm kiếm sách theo tên hoặc tác giả
export const searchBooks = async (req, res) => {
  try {
    const { keyword } = req.query;
    const regex = new RegExp(keyword, "i"); // không phân biệt hoa thường
    const results = await Book.find({
      $or: [{ Ten_Sach: regex }, { Tac_Gia: regex }],
    })
      .populate("Ma_NXB")
      .populate("Tac_Gia");
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm sách", error });
  }
};
