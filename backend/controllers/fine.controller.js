import Fine from "../models/fine.model.js";
import Borrow from "../models/borrow.model.js";
import Book from "../models/book.model.js";
import mongoose from "mongoose";

// Lấy danh sách phí phạt
export const getAllFines = async (req, res) => {
  try {
    const { Ma_Doc_Gia } = req.query;

    // Nếu có Ma_Doc_Gia, lọc theo độc giả
    const filter = Ma_Doc_Gia ? { Ma_Doc_Gia } : {};

    const fines = await Fine.find(filter)
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      })
      .populate("Ma_Muon")
      .sort({ createdAt: -1 });

    res.status(200).json(fines);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phí phạt", error });
  }
};

// Lấy tổng tiền phạt chưa thanh toán của một độc giả (chỉ từ collection Tien_Phat)
export const getTotalUnpaidFines = async (req, res) => {
  try {
    const { Ma_Doc_Gia } = req.params;

    const docGiaId = new mongoose.Types.ObjectId(Ma_Doc_Gia);

    // Lấy chỉ từ collection Tien_Phat - những tiền phạt đã được ghi nhận
    const result = await Fine.aggregate([
      {
        $match: {
          Ma_Doc_Gia: docGiaId,
          Trang_Thai_Thanh_Toan: "Chưa thanh toán",
        },
      },
      {
        $group: {
          _id: null,
          totalFine: { $sum: "$Tong_Tien" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAmount = result.length > 0 ? result[0].totalFine : 0;
    const count = result.length > 0 ? result[0].count : 0;

    res.status(200).json({
      totalFine: totalAmount,
      count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy tổng tiền phạt",
      error,
    });
  }
};

// Cập nhật trạng thái thanh toán phí phạt
export const updateFineStatus = async (req, res) => {
  try {
    const { fineId } = req.params;
    const { Trang_Thai_Thanh_Toan } = req.body;

    if (!["Chưa thanh toán", "Đã thanh toán"].includes(Trang_Thai_Thanh_Toan)) {
      return res.status(400).json({
        message: "Trạng thái thanh toán không hợp lệ",
      });
    }

    const updateData = {
      Trang_Thai_Thanh_Toan,
    };

    // Nếu thanh toán, thêm ngày thanh toán
    if (Trang_Thai_Thanh_Toan === "Đã thanh toán") {
      updateData.Ngay_Thanh_Toan = new Date();
    }

    const updated = await Fine.findByIdAndUpdate(fineId, updateData, {
      new: true,
    })
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      })
      .populate("Ma_Muon");

    if (!updated) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi phí phạt",
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({
      message: "Lỗi khi cập nhật trạng thái phí phạt",
      error: error.message,
    });
  }
};

// Xóa bản ghi phí phạt
export const deleteFine = async (req, res) => {
  try {
    const { fineId } = req.params;

    await Fine.findByIdAndDelete(fineId);

    res.status(200).json({
      message: "Đã xóa bản ghi phí phạt thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa bản ghi phí phạt",
      error,
    });
  }
};

// Auto-create fine records cho những sách đang mượn nhưng quá hạn
export const autoCreateOverdueFines = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lấy tất cả sách đang mượn nhưng quá hạn
    const overdueBooks = await Borrow.find({
      trang_thai: "Đang mượn",
      Ngay_Hen_Tra: { $lt: today },
    }).populate("Ma_Sach");

    console.log(`🔄 Found ${overdueBooks.length} overdue books`);

    let createdCount = 0;

    for (const borrow of overdueBooks) {
      // Kiểm tra xem đã có fine record cho sách này chưa
      const existingFine = await Fine.findOne({
        Ma_Muon: borrow._id,
        Trang_Thai_Thanh_Toan: "Chưa thanh toán",
      });

      if (!existingFine) {
        // Tính tiền phạt
        const dueDate = new Date(borrow.Ngay_Hen_Tra);
        dueDate.setHours(0, 0, 0, 0);
        const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        const bookPrice = borrow.Ma_Sach?.Don_Gia || 0;
        const fineAmount = daysLate * bookPrice;

        // Tạo fine record
        await Fine.create({
          Ma_Doc_Gia: borrow.Ma_Doc_Gia,
          Ma_Sach: borrow.Ma_Sach,
          Ma_Muon: borrow._id,
          Tien_Phat: fineAmount,
          Tong_Tien: fineAmount,
          Ngay_Hen_Tra: borrow.Ngay_Hen_Tra,
          Ngay_Tra_Thuc_Te: today,
          So_Ngay_Tre: daysLate,
          Trang_Thai_Thanh_Toan: "Chưa thanh toán",
          Ghi_Chu: `Auto-created: Quá hạn ${daysLate} ngày. Giá sách: ${bookPrice} VND/ngày`,
        });

        createdCount++;
        console.log(
          `✅ Created fine for borrow ${borrow._id}: ${fineAmount} VND`
        );
      }
    }

    res.status(200).json({
      message: `Đã tạo ${createdCount} bản ghi tiền phạt`,
      createdCount,
      totalOverdue: overdueBooks.length,
    });
  } catch (error) {
    console.error("❌ Error in autoCreateOverdueFines:", error);
    res.status(500).json({
      message: "Lỗi khi tạo tiền phạt tự động",
      error: error.message,
    });
  }
};
