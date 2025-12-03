import Reader from "../models/reader.model.js";

// Lấy danh sách độc giả
export const getAllReaders = async (req, res) => {
  try {
    const readers = await Reader.find();
    res.status(200).json(readers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách độc giả", error });
  }
};

// Lấy độc giả theo ID
export const getReaderById = async (req, res) => {
  try {
    const reader = await Reader.findById(req.params.id);
    if (!reader) {
      return res.status(404).json({ message: "Không tìm thấy độc giả" });
    }
    res.status(200).json(reader);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin độc giả", error });
  }
};

// Thêm độc giả mới
export const createReader = async (req, res) => {
  try {
    const newReader = await Reader.create(req.body);
    res.status(201).json(newReader);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi thêm độc giả", error });
  }
};

// Cập nhật độc giả
export const updateReader = async (req, res) => {
  try {
    const updated = await Reader.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi cập nhật độc giả", error });
  }
};

// Xóa độc giả
export const deleteReader = async (req, res) => {
  try {
    await Reader.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Đã xóa độc giả thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa độc giả", error });
  }
};
