import Borrow from "../models/borrow.model.js";
import Book from "../models/book.model.js";
import Fine from "../models/fine.model.js";
import mongoose from "mongoose";
import { emitEvent } from "../config/socket.js";
import EmailService from "../services/email.service.js";

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
    const { Ma_Doc_Gia, Ma_Sach, Ngay_Muon, Ngay_Hen_Tra, trang_thai } =
      req.body;

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
        message:
          "Bạn đã mượn 3 cuốn sách. Vui lòng trả sách trước khi mượn thêm.",
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
        message:
          "Bạn đã mượn cuốn sách này. Vui lòng trả sách trước khi mượn lại.",
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

    // Emit real-time update
    emitEvent("borrow:created", { borrowId: newBorrow._id });

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

    console.log("updateBorrow called - borrowId:", borrowId);
    console.log("Request body:", req.body);
    console.log("New status:", trang_thai);

    // Get original borrow record
    const originalBorrow = await Borrow.findById(borrowId);

    if (!originalBorrow) {
      return res.status(404).json({
        message: "Bản ghi mượn sách không tồn tại",
      });
    }

    console.log("Original status:", originalBorrow.trang_thai);

    // Update borrow record
    const updateData = {};
    if (Ngay_Tra_Thuc_Te) {
      updateData.Ngay_Tra = new Date(Ngay_Tra_Thuc_Te);
    }
    if (trang_thai) {
      updateData.trang_thai = trang_thai;
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

    // Nếu admin xác nhận mượn sách (từ Chờ xác nhận -> Đang mượn)
    if (
      trang_thai === "Đang mượn" &&
      originalBorrow.trang_thai === "Chờ xác nhận"
    ) {
      console.log("Admin confirmed borrow, preparing to send email...");
      console.log("Reader email:", updated.Ma_Doc_Gia?.Email);
      console.log("Book title:", updated.Ma_Sach?.Ten_Sach);

      // Gửi email xác nhận mượn sách
      if (updated.Ma_Doc_Gia?.Email && updated.Ma_Sach) {
        try {
          const readerName = `${updated.Ma_Doc_Gia.Ho_Lot || ""} ${
            updated.Ma_Doc_Gia.Ten || ""
          }`.trim();
          await EmailService.sendBorrowConfirmationEmail(
            updated.Ma_Doc_Gia.Email,
            readerName || "Độc giả",
            updated.Ma_Sach.Ten_Sach || "N/A",
            updated.Ngay_Muon,
            updated.Ngay_Hen_Tra
          );
          console.log(
            `📧 Borrow confirmation email sent to ${updated.Ma_Doc_Gia.Email}`
          );
        } catch (emailError) {
          console.error(
            "❌ Error sending borrow confirmation email:",
            emailError
          );
        }
      } else {
        console.log("⚠️ Cannot send email - missing email or book info");
      }
    }

    // Nếu trả sách thì tăng lại So_Quyen
    if (
      trang_thai === "Đã trả" &&
      (originalBorrow.trang_thai === "Đang mượn" ||
        originalBorrow.trang_thai === "Quá hạn")
    ) {
      await Book.findByIdAndUpdate(
        originalBorrow.Ma_Sach,
        { $inc: { So_Quyen: 1 } },
        { new: true }
      );

      console.log("Return confirmed, preparing to send email...");
      console.log("Reader email:", updated.Ma_Doc_Gia?.Email);
      console.log("Book title:", updated.Ma_Sach?.Ten_Sach);

      // Gửi email xác nhận trả sách
      if (updated.Ma_Doc_Gia?.Email && updated.Ma_Sach) {
        try {
          const readerName = `${updated.Ma_Doc_Gia.Ho_Lot || ""} ${
            updated.Ma_Doc_Gia.Ten || ""
          }`.trim();
          await EmailService.sendReturnConfirmationEmail(
            updated.Ma_Doc_Gia.Email,
            readerName || "Độc giả",
            updated.Ma_Sach.Ten_Sach || "N/A",
            updateData.Ngay_Tra || new Date()
          );
          console.log(
            `📧 Return confirmation email sent to ${updated.Ma_Doc_Gia.Email}`
          );
        } catch (emailError) {
          console.error(
            "❌ Error sending return confirmation email:",
            emailError
          );
        }
      } else {
        console.log("⚠️ Cannot send email - missing email or book info");
      }

      // Emit books updated event for real-time sync
      emitEvent("books:updated", { bookId: originalBorrow.Ma_Sach });
    }
    // Emit real-time update
    emitEvent("borrow:updated", { borrowId, trang_thai });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update Borrow Error:", error.message);
    console.error("Error Stack:", error.stack);
    res.status(400).json({
      message: "Lỗi khi cập nhật bản ghi mượn sách",
      error: error.message,
    });
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

    console.log(`${updates.modifiedCount} return requests created`);

    res.status(200).json({
      message: `Đã gửi yêu cầu trả ${updates.modifiedCount} cuốn sách. Nhân viên thư viện sẽ liên hệ với bạn sớm!`,
      modifiedCount: updates.modifiedCount,
    });
  } catch (error) {
    console.error("Error in requestReturn:", error);
    res.status(500).json({
      message: "Lỗi khi gửi yêu cầu trả sách",
      error: error.message,
    });
  }
};

// Auto-update status for overdue books (both directions)
export const autoUpdateOverdueStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdueCount = 0;
    let backToNormalCount = 0;

    // 1. Tìm sách "Đang mượn" nhưng quá hạn → chuyển thành "Quá hạn"
    const overdueBooks = await Borrow.find({
      trang_thai: "Đang mượn",
      Ngay_Hen_Tra: { $lt: today },
    })
      .populate("Ma_Doc_Gia")
      .populate("Ma_Sach");

    for (const borrow of overdueBooks) {
      await Borrow.findByIdAndUpdate(
        borrow._id,
        { trang_thai: "Quá hạn" },
        { new: true }
      );
      overdueCount++;
      console.log(`Updated borrow ${borrow._id} to "Quá hạn"`);

      // Gửi email nhắc nhở trả sách
      if (borrow.Ma_Doc_Gia?.Email && borrow.Ma_Sach) {
        try {
          const readerName = `${borrow.Ma_Doc_Gia.Ho_Lot || ""} ${
            borrow.Ma_Doc_Gia.Ten || ""
          }`.trim();
          await EmailService.sendReturnReminderEmail(
            borrow.Ma_Doc_Gia.Email,
            readerName || "Độc giả",
            borrow.Ma_Sach.Ten_Sach || "N/A",
            borrow.Ngay_Hen_Tra
          );
          console.log(
            `Overdue reminder email sent to ${borrow.Ma_Doc_Gia.Email}`
          );
        } catch (emailError) {
          console.error("Error sending overdue reminder email:", emailError);
        }
      }
    }

    // 2. Tìm sách "Quá hạn" nhưng ngày hẹn trả chưa đến → chuyển về "Đang mượn"
    const backToNormalBooks = await Borrow.find({
      trang_thai: "Quá hạn",
      Ngay_Hen_Tra: { $gte: today },
    });

    for (const borrow of backToNormalBooks) {
      await Borrow.findByIdAndUpdate(
        borrow._id,
        { trang_thai: "Đang mượn" },
        { new: true }
      );
      backToNormalCount++;
      console.log(`Updated borrow ${borrow._id} back to "Đang mượn"`);
    }

    const totalUpdated = overdueCount + backToNormalCount;

    // Emit real-time update if any books were updated
    if (totalUpdated > 0) {
      emitEvent("borrow:updated", {
        overdueCount,
        backToNormalCount,
        type: "status_sync",
      });
    }

    res.status(200).json({
      message: `Đã cập nhật ${totalUpdated} phiếu mượn (${overdueCount} quá hạn, ${backToNormalCount} còn hạn)`,
      overdueCount,
      backToNormalCount,
      totalUpdated,
    });
  } catch (error) {
    console.error("Error in autoUpdateOverdueStatus:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái",
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

    // Gửi email xác nhận mượn sách
    if (updatedBorrow.Ma_Doc_Gia?.Email && updatedBorrow.Ma_Sach) {
      try {
        const readerName = `${updatedBorrow.Ma_Doc_Gia.Ho_Lot || ""} ${
          updatedBorrow.Ma_Doc_Gia.Ten || ""
        }`.trim();
        await EmailService.sendBorrowConfirmationEmail(
          updatedBorrow.Ma_Doc_Gia.Email,
          readerName || "Độc giả",
          updatedBorrow.Ma_Sach.Ten_Sach || "N/A",
          updatedBorrow.Ngay_Muon,
          updatedBorrow.Ngay_Hen_Tra
        );
        console.log(
          `Borrow confirmation email sent to ${updatedBorrow.Ma_Doc_Gia.Email}`
        );
      } catch (emailError) {
        console.error("Error sending borrow confirmation email:", emailError);
      }
    }

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
