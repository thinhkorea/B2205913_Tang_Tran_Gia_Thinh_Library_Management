import Borrow from "../models/borrow.model.js";
import Book from "../models/book.model.js";
import Fine from "../models/fine.model.js";
import mongoose from "mongoose";

// Lấy danh sách mượn sách
export const getAllBorrows = async (req, res) => {
  try {
    const { Ma_Doc_Gia } = req.query;
    
    // Nếu có Ma_Doc_Gia parameter, lọc theo độc giả
    const filter = Ma_Doc_Gia ? { Ma_Doc_Gia } : {};
    
    const borrows = await Borrow.find(filter)
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      });
    res.status(200).json(borrows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách mượn sách", error });
  }
};

// Thêm bản ghi mượn sách
export const createBorrow = async (req, res) => {
  try {
    const { Ma_Doc_Gia, Ma_Sach, Ngay_Muon, Ngay_Hen_Tra, trang_thai } = req.body;

    // Validate required fields
    if (!Ma_Doc_Gia || !Ma_Sach) {
      return res.status(400).json({
        message: "Ma_Doc_Gia và Ma_Sach là bắt buộc",
      });
    }

    // Convert string IDs to ObjectId if needed
    const docGiaId = new mongoose.Types.ObjectId(Ma_Doc_Gia);
    const sachId = new mongoose.Types.ObjectId(Ma_Sach);

    // Kiểm tra số lượng sách chưa trả hoặc chờ xác nhận (tối đa 3 cuốn)
    const unreturned = await Borrow.countDocuments({
      Ma_Doc_Gia: docGiaId,
      trang_thai: { $in: ["Chờ xác nhận", "Đang mượn"] },
    });

    if (unreturned >= 3) {
      return res.status(400).json({
        message: "Bạn đã mượn 3 cuốn sách. Vui lòng trả sách trước khi mượn thêm.",
      });
    }

    // Kiểm tra đã mượn cuốn sách này chưa (chưa trả hoặc chờ xác nhận)
    const alreadyBorrowed = await Borrow.findOne({
      Ma_Doc_Gia: docGiaId,
      Ma_Sach: sachId,
      trang_thai: { $in: ["Chờ xác nhận", "Đang mượn"] },
    });

    if (alreadyBorrowed) {
      return res.status(400).json({
        message: "Bạn đã mượn cuốn sách này. Vui lòng trả sách trước khi mượn lại.",
      });
    }

    const borrowData = {
      Ma_Doc_Gia: docGiaId,
      Ma_Sach: sachId,
      Ngay_Muon: Ngay_Muon ? new Date(Ngay_Muon) : new Date(),
      trang_thai: "Chờ xác nhận", // Mặc định là "Chờ xác nhận"
    };

    // Set Ngay_Hen_Tra: nếu có thì dùng, không thì mặc định = Ngay_Muon + 14 ngày
    if (Ngay_Hen_Tra) {
      borrowData.Ngay_Hen_Tra = new Date(Ngay_Hen_Tra);
    } else {
      const returnDate = new Date(borrowData.Ngay_Muon);
      returnDate.setDate(returnDate.getDate() + 14);
      borrowData.Ngay_Hen_Tra = returnDate;
    }

    console.log("Creating borrow with data:", borrowData);
    const newBorrow = await Borrow.create(borrowData);
    
    // Trừ So_Quyen của sách
    await Book.findByIdAndUpdate(
      sachId,
      { $inc: { So_Quyen: -1 } },
      { new: true }
    );
    
    await newBorrow.populate("Ma_Doc_Gia");
    await newBorrow.populate({
      path: "Ma_Sach",
      populate: {
        path: "Tac_Gia",
      },
    });
    res.status(201).json(newBorrow);
  } catch (error) {
    console.error("Create Borrow Error:", error);
    res.status(400).json({
      message: "Lỗi khi thêm bản ghi mượn sách",
      error: error.message,
    });
  }
};

// Cập nhật bản ghi mượn sách (cập nhật ngày trả, trạng thái)
export const updateBorrow = async (req, res) => {
  try {
    const { Ngay_Tra_Thuc_Te, trang_thai } = req.body;
    const borrowId = req.params.id;

    // Get original borrow record
    const originalBorrow = await Borrow.findById(borrowId);
    
    if (!originalBorrow) {
      return res.status(404).json({
        message: "Bản ghi mượn sách không tồn tại",
      });
    }

    // Update borrow record
    const updateData = {};
    if (Ngay_Tra_Thuc_Te) {
      updateData.Ngay_Tra = new Date(Ngay_Tra_Thuc_Te);
    }
    if (trang_thai) {
      updateData.trang_thai = trang_thai;
    }

    // Tính tiền phạt nếu quá hạn
    if (trang_thai === "Đã trả" || (Ngay_Tra_Thuc_Te && !trang_thai)) {
      const returnDate = Ngay_Tra_Thuc_Te ? new Date(Ngay_Tra_Thuc_Te) : new Date();
      const dueDate = new Date(originalBorrow.Ngay_Hen_Tra);
      
      // Nếu trả muộn, tính tiền phạt (Giá sách × Số ngày trễ)
      if (returnDate > dueDate) {
        const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        
        // Lấy giá sách
        const book = await Book.findById(originalBorrow.Ma_Sach);
        const bookPrice = book?.Don_Gia || 0;
        
        // Tiền phạt = Giá sách × Số ngày trễ
        const fineAmount = daysLate * bookPrice;
        
        updateData.Tien_Phat = fineAmount;

        // Lưu phí phạt vào collection Tien_Phat
        await Fine.create({
          Ma_Doc_Gia: originalBorrow.Ma_Doc_Gia,
          Ma_Sach: originalBorrow.Ma_Sach,
          Ma_Muon: borrowId,
          Tien_Phat: fineAmount,
          Tong_Tien: fineAmount,
          Ngay_Hen_Tra: originalBorrow.Ngay_Hen_Tra,
          Ngay_Tra_Thuc_Te: returnDate,
          So_Ngay_Tre: daysLate,
          Trang_Thai_Thanh_Toan: "Chưa thanh toán",
          Ghi_Chu: `Trả muộn ${daysLate} ngày. Giá sách: ${bookPrice} VND/ngày`,
        });
      } else {
        updateData.Tien_Phat = 0; // Không phạt nếu trả đúng hạn
      }
    }

    const updated = await Borrow.findByIdAndUpdate(borrowId, updateData, {
      new: true,
    })
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      });

    // Nếu trả sách thì tăng lại So_Quyen
    if (trang_thai === "Đã trả" && originalBorrow.trang_thai === "Đang mượn") {
      await Book.findByIdAndUpdate(
        originalBorrow.Ma_Sach,
        { $inc: { So_Quyen: 1 } },
        { new: true }
      );
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update Borrow Error:", error.message);
    console.error("Error Stack:", error.stack);
    res
      .status(400)
      .json({ message: "Lỗi khi cập nhật bản ghi mượn sách", error: error.message });
  }
};

// Xóa bản ghi mượn sách
export const deleteBorrow = async (req, res) => {
  try {
    await Borrow.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Đã xóa bản ghi mượn sách thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bản ghi mượn sách", error });
  }
};

// User gửi yêu cầu trả sách
export const requestReturn = async (req, res) => {
  try {
    const { borrowIds } = req.body; // Mảng các ID phiếu mượn

    if (!borrowIds || !Array.isArray(borrowIds) || borrowIds.length === 0) {
      return res.status(400).json({
        message: "borrowIds phải là mảng không rỗng",
      });
    }

    const updates = await Borrow.updateMany(
      { _id: { $in: borrowIds } },
      {
        return_request: true,
        return_request_date: new Date(),
      }
    );

    console.log(`✅ ${updates.modifiedCount} return requests created`);

    res.status(200).json({
      message: `Đã gửi yêu cầu trả ${updates.modifiedCount} cuốn sách. Nhân viên thư viện sẽ liên hệ với bạn sớm!`,
      modifiedCount: updates.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error in requestReturn:", error);
    res.status(500).json({
      message: "Lỗi khi gửi yêu cầu trả sách",
      error: error.message,
    });
  }
};

// Auto-update status for overdue books
export const autoUpdateOverdueStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tìm tất cả sách đang mượn nhưng quá hạn
    const overdueBooks = await Borrow.find({
      trang_thai: "Đang mượn",
      Ngay_Hen_Tra: { $lt: today },
    });

    console.log(`🔄 Found ${overdueBooks.length} overdue books`);

    let updatedCount = 0;

    for (const borrow of overdueBooks) {
      // Update status to "Quá hạn"
      await Borrow.findByIdAndUpdate(
        borrow._id,
        { trang_thai: "Quá hạn" },
        { new: true }
      );
      updatedCount++;
      console.log(`✅ Updated borrow ${borrow._id} to "Quá hạn"`);
    }

    res.status(200).json({
      message: `Đã cập nhật ${updatedCount} phiếu mượn thành "Quá hạn"`,
      updatedCount,
      totalOverdue: overdueBooks.length,
    });
  } catch (error) {
    console.error("❌ Error in autoUpdateOverdueStatus:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái quá hạn",
      error: error.message,
    });
  }
};

// Xác nhận phiếu mượn (staff/admin xác nhận, đổi từ "Chờ xác nhận" → "Đang mượn")
export const approveBorrow = async (req, res) => {
  try {
    const { id } = req.params;

    const borrow = await Borrow.findById(id);
    if (!borrow) {
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    }

    if (borrow.trang_thai !== "Chờ xác nhận") {
      return res.status(400).json({
        message: `Chỉ có thể xác nhận phiếu với trạng thái "Chờ xác nhận", hiện tại là "${borrow.trang_thai}"`,
      });
    }

    // Update status to "Đang mượn"
    const updatedBorrow = await Borrow.findByIdAndUpdate(
      id,
      { trang_thai: "Đang mượn" },
      { new: true }
    )
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      });

    res.status(200).json({
      message: "Phiếu mượn đã được xác nhận",
      borrow: updatedBorrow,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xác nhận phiếu mượn",
      error: error.message,
    });
  }
};

// Hủy phiếu mượn (staff/admin hủy phiếu chờ xác nhận)
export const rejectBorrow = async (req, res) => {
  try {
    const { id } = req.params;

    const borrow = await Borrow.findById(id);
    if (!borrow) {
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    }

    if (borrow.trang_thai !== "Chờ xác nhận") {
      return res.status(400).json({
        message: `Chỉ có thể hủy phiếu với trạng thái "Chờ xác nhận", hiện tại là "${borrow.trang_thai}"`,
      });
    }

    // Xóa phiếu mượn và cộng lại số quyển sách
    await Borrow.findByIdAndDelete(id);

    // Cộng lại So_Quyen của sách
    await Book.findByIdAndUpdate(
      borrow.Ma_Sach,
      { $inc: { So_Quyen: 1 } },
      { new: true }
    );

    res.status(200).json({
      message: "Phiếu mượn đã được hủy",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi hủy phiếu mượn",
      error: error.message,
    });
  }
};

// Lấy danh sách phiếu chờ xác nhận
export const getPendingBorrows = async (req, res) => {
  try {
    const pending = await Borrow.find({ trang_thai: "Chờ xác nhận" })
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách phiếu chờ xác nhận",
      error: error.message,
    });
  }
};

