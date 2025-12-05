import Fine from "../models/fine.model.js";
import Borrow from "../models/borrow.model.js";
import Book from "../models/book.model.js";
import mongoose from "mongoose";
import { emitEvent } from "../config/socket.js";
import EmailService from "../services/email.service.js";

// Tạo mới bản ghi tiền phạt
export const createFine = async (req, res) => {
  try {
    const {
      Ma_Doc_Gia,
      Ma_Sach,
      Ma_Muon,
      Tien_Phat,
      Tong_Tien,
      Ngay_Hen_Tra,
      Ngay_Tra_Thuc_Te,
      So_Ngay_Tre,
      Trang_Thai_Thanh_Toan,
      Ghi_Chu,
    } = req.body;

    // Check if fine already exists for this borrow (any status)
    const existingFine = await Fine.findOne({
      Ma_Muon: Ma_Muon,
    });

    if (existingFine) {
      return res.status(400).json({
        message: "Bản ghi tiền phạt đã tồn tại cho sách mượn này",
      });
    }

    const newFine = await Fine.create({
      Ma_Doc_Gia,
      Ma_Sach,
      Ma_Muon,
      Tien_Phat: Tien_Phat || 0,
      Tong_Tien: Tong_Tien || 0,
      Ngay_Hen_Tra,
      Ngay_Tra_Thuc_Te,
      So_Ngay_Tre,
      Trang_Thai_Thanh_Toan: Trang_Thai_Thanh_Toan || "Chưa thanh toán",
      Ghi_Chu: Ghi_Chu || "",
    });

    const populatedFine = await Fine.findById(newFine._id)
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      })
      .populate("Ma_Muon");

    // Gửi email thông báo phạt
    if (populatedFine.Ma_Doc_Gia?.Email) {
      const readerName = `${populatedFine.Ma_Doc_Gia.Ho_Lot || ""} ${
        populatedFine.Ma_Doc_Gia.Ten || ""
      }`.trim();
      await EmailService.sendFineNotificationEmail(
        populatedFine.Ma_Doc_Gia.Email,
        readerName || "Độc giả",
        populatedFine.Tong_Tien,
        populatedFine.Ghi_Chu || "Trả sách quá hạn"
      );
    }

    res.status(201).json(populatedFine);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo bản ghi tiền phạt",
      error: error.message,
    });
  }
};

// Lấy danh sách phí phạt
export const getAllFines = async (req, res) => {
  try {
    const { Ma_Doc_Gia, Ma_Muon } = req.query;

    // Xây dựng filter dựa trên query parameters
    const filter = {};
    if (Ma_Doc_Gia) filter.Ma_Doc_Gia = Ma_Doc_Gia;
    if (Ma_Muon) filter.Ma_Muon = Ma_Muon;

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

    console.log(`getTotalUnpaidFines for reader: ${Ma_Doc_Gia}`);

    // Validate and convert Ma_Doc_Gia to ObjectId
    if (!mongoose.Types.ObjectId.isValid(Ma_Doc_Gia)) {
      console.warn(`Invalid Ma_Doc_Gia format: ${Ma_Doc_Gia}`);
      return res.status(400).json({
        message: "Ma_Doc_Gia không hợp lệ",
        totalFine: 0,
        count: 0,
      });
    }

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

    console.log(`Total unpaid fines: ${totalAmount} VND (${count} records)`);

    res.status(200).json({
      totalFine: totalAmount,
      count,
    });
  } catch (error) {
    console.error("Error in getTotalUnpaidFines:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tổng tiền phạt",
      error: error.message,
      totalFine: 0,
      count: 0,
    });
  }
};

// Cập nhật trạng thái thanh toán phí phạt
export const updateFineStatus = async (req, res) => {
  try {
    const { fineId } = req.params;
    const updateData = req.body;

    // Xây dựng object cập nhật với các field cho phép
    const updateFields = {};

    // Cập nhật trạng thái thanh toán
    if (updateData.Trang_Thai_Thanh_Toan) {
      if (
        !["Chưa thanh toán", "Đã thanh toán"].includes(
          updateData.Trang_Thai_Thanh_Toan
        )
      ) {
        return res.status(400).json({
          message: "Trạng thái thanh toán không hợp lệ",
        });
      }
      updateFields.Trang_Thai_Thanh_Toan = updateData.Trang_Thai_Thanh_Toan;
    }

    // Cập nhật tiền phạt nếu có
    if (updateData.Tien_Phat !== undefined)
      updateFields.Tien_Phat = updateData.Tien_Phat;
    if (updateData.Tong_Tien !== undefined)
      updateFields.Tong_Tien = updateData.Tong_Tien;
    if (updateData.So_Ngay_Tre !== undefined)
      updateFields.So_Ngay_Tre = updateData.So_Ngay_Tre;
    if (updateData.Ghi_Chu) updateFields.Ghi_Chu = updateData.Ghi_Chu;
    if (updateData.Ngay_Tra_Thuc_Te)
      updateFields.Ngay_Tra_Thuc_Te = updateData.Ngay_Tra_Thuc_Te;

    const updated = await Fine.findByIdAndUpdate(fineId, updateFields, {
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

// Cleanup fine cũ (xóa những fine không phải từ logic mới 10,000 VND/ngày)
export const cleanupOldFines = async (req, res) => {
  try {
    // Lấy tất cả fine chưa thanh toán
    const unpaidFines = await Fine.find({
      Trang_Thai_Thanh_Toan: "Chưa thanh toán",
    }).populate("Ma_Muon");

    let deletedCount = 0;
    const deletedFines = [];

    for (const fine of unpaidFines) {
      if (fine.Ma_Muon && fine.Ma_Muon.Ma_Sach) {
        // Lấy thông tin sách để check giá cũ
        const book = await Book.findById(fine.Ma_Muon.Ma_Sach);

        // Nếu tiền phạt không phải bội số của 10,000 hoặc cách tính không đúng, xóa
        // Kiểm tra: tiền phạt nên bằng So_Ngay_Tre * 10000
        const expectedFine = fine.So_Ngay_Tre * 10000;

        if (fine.Tien_Phat !== expectedFine) {
          deletedFines.push({
            id: fine._id,
            oldFine: fine.Tien_Phat,
            expectedFine: expectedFine,
          });

          await Fine.findByIdAndDelete(fine._id);
          deletedCount++;
          console.log(
            `Deleted old fine ${fine._id}: was ${fine.Tien_Phat}, should be ${expectedFine}`
          );
        }
      }
    }

    res.status(200).json({
      message: `Đã xóa ${deletedCount} phiếu phạt cũ`,
      deletedCount,
      deletedFines,
    });
  } catch (error) {
    console.error("❌ Error in cleanupOldFines:", error);
    res.status(500).json({
      message: "Lỗi khi cleanup phiếu phạt cũ",
      error: error.message,
    });
  }
};

// Auto-create fine records cho những sách đang mượn nhưng quá hạn
export const autoCreateOverdueFines = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`autoCreateOverdueFines - Today: ${today.toISOString()}`);

    // Lấy tất cả sách đang mượn hoặc quá hạn (để xử lý cả 2 chiều)
    const borrowings = await Borrow.find({
      trang_thai: { $in: ["Đang mượn", "Quá hạn"] },
    }).populate("Ma_Sach");

    console.log(`Found ${borrowings.length} borrowing records`);

    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    for (const borrow of borrowings) {
      // Convert Ngay_Hen_Tra to Date for comparison
      const dueDate = new Date(borrow.Ngay_Hen_Tra);
      dueDate.setHours(0, 0, 0, 0);

      console.log(
        `Checking borrow ${
          borrow._id
        }: due ${dueDate.toISOString()}, today ${today.toISOString()}`
      );

      // Check nếu KHÔNG quá hạn (today <= dueDate)
      if (today <= dueDate) {
        console.log(
          `Borrow ${borrow._id} still valid. Due: ${dueDate.toISOString()}`
        );

        // Xóa fine nếu có (trường hợp sửa Ngay_Hen_Tra thành tương lai)
        const existingFine = await Fine.findOne({
          Ma_Muon: borrow._id,
          Trang_Thai_Thanh_Toan: "Chưa thanh toán",
        });

        if (existingFine) {
          await Fine.findByIdAndDelete(existingFine._id);
          deletedCount++;
          console.log(
            `Deleted fine for borrow ${borrow._id} (no longer overdue)`
          );
        }

        continue;
      }

      console.log(
        `Borrow ${borrow._id} is OVERDUE. Due: ${dueDate.toISOString()}`
      );

      // Tính tiền phạt dựa trên Borrow hiện tại
      // Tính số ngày từ ngày hạn trả đến hôm nay (không tính ngày hạn trả)
      const timeDiff = today.getTime() - dueDate.getTime();
      const daysLate = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      // Nếu quá hạn ít nhất 1 ngày thì mới phạt
      if (daysLate < 1) {
        console.log(`Not late enough (${daysLate} days), skipping`);
        continue;
      }

      const finePerDay = 10000; // 10,000 VND per day
      const fineAmount = daysLate * finePerDay;

      console.log(`Overdue ${daysLate} days, fine: ${fineAmount} VND`);

      // Kiểm tra xem đã có fine record cho sách này chưa
      const existingFine = await Fine.findOne({
        Ma_Muon: borrow._id,
      });

      if (!existingFine) {
        // Tạo fine record mới
        try {
          const newFine = await Fine.create({
            Ma_Doc_Gia: borrow.Ma_Doc_Gia,
            Ma_Sach: borrow.Ma_Sach._id,
            Ma_Muon: borrow._id,
            Tien_Phat: fineAmount,
            Tong_Tien: fineAmount,
            Ngay_Hen_Tra: borrow.Ngay_Hen_Tra,
            Ngay_Tra_Thuc_Te: today,
            So_Ngay_Tre: daysLate,
            Trang_Thai_Thanh_Toan: "Chưa thanh toán",
            Ghi_Chu: `Auto-created: Quá hạn ${daysLate} ngày. 10,000 VND/ngày`,
          });

          // Populate để lấy thông tin reader
          const populatedFine = await Fine.findById(newFine._id)
            .populate("Ma_Doc_Gia")
            .populate("Ma_Sach");

          // Gửi email thông báo phạt
          if (populatedFine.Ma_Doc_Gia?.Email) {
            const readerName = `${populatedFine.Ma_Doc_Gia.Ho_Lot || ""} ${
              populatedFine.Ma_Doc_Gia.Ten || ""
            }`.trim();
            await EmailService.sendFineNotificationEmail(
              populatedFine.Ma_Doc_Gia.Email,
              readerName || "Độc giả",
              populatedFine.Tong_Tien,
              populatedFine.Ghi_Chu
            );
            console.log(
              `Fine notification email sent to ${populatedFine.Ma_Doc_Gia.Email}`
            );
          }

          createdCount++;
          console.log(
            `Created fine for borrow ${borrow._id}: ${fineAmount} VND (${daysLate} days late)`
          );
        } catch (createErr) {
          console.error(
            `Error creating fine for ${borrow._id}:`,
            createErr.message
          );
        }
      } else if (existingFine.Trang_Thai_Thanh_Toan === "Chưa thanh toán") {
        // UPDATE fine nếu tiền phạt thay đổi (do Borrow ngày hẹn trả bị sửa)
        if (existingFine.Tien_Phat !== fineAmount) {
          try {
            await Fine.findByIdAndUpdate(existingFine._id, {
              Tien_Phat: fineAmount,
              Tong_Tien: fineAmount,
              Ngay_Hen_Tra: borrow.Ngay_Hen_Tra,
              So_Ngay_Tre: daysLate,
              Ghi_Chu: `Auto-updated: Quá hạn ${daysLate} ngày. 10,000 VND/ngày`,
            });
            updatedCount++;
            console.log(
              `Updated fine for borrow ${borrow._id}: ${fineAmount} VND`
            );
          } catch (updateErr) {
            console.error(
              `Error updating fine for ${borrow._id}:`,
              updateErr.message
            );
          }
        }
      } else {
        console.log(`⏭Fine for borrow ${borrow._id} already paid, skipping`);
      }
    }

    // Emit real-time update if any fines were created/updated/deleted
    if (createdCount > 0 || updatedCount > 0 || deletedCount > 0) {
      emitEvent("fine:created", {
        createdCount,
        updatedCount,
        deletedCount,
        type: "auto",
      });
    }

    res.status(200).json({
      message: `Đã xử lý: ${createdCount} tạo mới, ${updatedCount} cập nhật, ${deletedCount} xóa`,
      createdCount,
      updatedCount,
      deletedCount,
      totalBorrowings: borrowings.length,
    });
  } catch (error) {
    console.error("Error in autoCreateOverdueFines:", error);
    res.status(500).json({
      message: "Lỗi khi tạo tiền phạt tự động",
      error: error.message,
    });
  }
};

// Tạo fine cho một borrow cụ thể nếu quá hạn (dùng khi admin trả sách)
export const createFineForBorrow = async (req, res) => {
  try {
    const { Ma_Muon } = req.params;

    console.log(`createFineForBorrow: ${Ma_Muon}`);

    if (!mongoose.Types.ObjectId.isValid(Ma_Muon)) {
      return res.status(400).json({
        message: "Ma_Muon không hợp lệ",
        fineCreated: false,
      });
    }

    // Lấy borrow info
    const borrow = await Borrow.findById(Ma_Muon).populate("Ma_Sach");
    if (!borrow) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi mượn",
        fineCreated: false,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(borrow.Ngay_Hen_Tra);
    dueDate.setHours(0, 0, 0, 0);

    // Kiểm tra có quá hạn không
    if (today <= dueDate) {
      console.log(`Borrow not overdue, no fine created`);
      return res.status(200).json({
        message: "Sách không quá hạn, không cần tạo phiếu phạt",
        fineCreated: false,
        daysLate: 0,
      });
    }

    // Tính tiền phạt
    const timeDiff = today.getTime() - dueDate.getTime();
    const daysLate = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysLate < 1) {
      return res.status(200).json({
        message: "Chưa đủ 1 ngày quá hạn, không phạt",
        fineCreated: false,
        daysLate: daysLate,
      });
    }

    const finePerDay = 10000;
    const fineAmount = daysLate * finePerDay;

    // Kiểm tra đã có fine chưa
    const existingFine = await Fine.findOne({
      Ma_Muon: Ma_Muon,
    });

    if (existingFine) {
      console.log(`Fine already exists for this borrow`);
      return res.status(200).json({
        message: "Phiếu phạt đã tồn tại",
        fineCreated: false,
        existing: existingFine,
      });
    }

    // Tạo fine mới
    const newFine = await Fine.create({
      Ma_Doc_Gia: borrow.Ma_Doc_Gia,
      Ma_Sach: borrow.Ma_Sach._id,
      Ma_Muon: borrow._id,
      Tien_Phat: fineAmount,
      Tong_Tien: fineAmount,
      Ngay_Hen_Tra: borrow.Ngay_Hen_Tra,
      Ngay_Tra_Thuc_Te: today,
      So_Ngay_Tre: daysLate,
      Trang_Thai_Thanh_Toan: "Chưa thanh toán",
      Ghi_Chu: `Auto-created: Quá hạn ${daysLate} ngày. 10,000 VND/ngày`,
    });

    const populatedFine = await Fine.findById(newFine._id)
      .populate("Ma_Doc_Gia")
      .populate({
        path: "Ma_Sach",
        populate: {
          path: "Tac_Gia",
        },
      })
      .populate("Ma_Muon");

    console.log(`Fine created: ${fineAmount} VND (${daysLate} days late)`);

    // Emit real-time update
    emitEvent("fine:created", {
      fineId: newFine._id,
      fineAmount,
      daysLate,
    });

    res.status(201).json({
      message: "Phiếu phạt đã tạo thành công",
      fineCreated: true,
      fine: populatedFine,
      daysLate,
      fineAmount,
    });
  } catch (error) {
    console.error("Error in createFineForBorrow:", error);
    res.status(500).json({
      message: "Lỗi khi tạo phiếu phạt",
      error: error.message,
      fineCreated: false,
    });
  }
};
