import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema(
  {
    Ma_Doc_Gia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },
    Ma_Sach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    Ngay_Muon: { type: Date, default: Date.now },
    Ngay_Hen_Tra: { type: Date, required: true }, // Ngày hẹn trả
    Ngay_Tra: { type: Date }, // Ngày trả thực tế
    trang_thai: {
      type: String,
      enum: ["Chờ xác nhận", "Đang mượn", "Đã trả", "Quá hạn"],
      default: "Chờ xác nhận",
    },
    Tien_Phat: { 
      type: Number, 
      default: 0 
    }, // Tiền phạt quá hạn (tính theo ngày)
    return_request: {
      type: Boolean,
      default: false
    }, // Yêu cầu trả sách từ user
    return_request_date: {
      type: Date
    }, // Ngày gửi yêu cầu trả sách
  },
  { collection: "Theo_Doi_Muon_Sach", timestamps: true, versionKey: false }
);

export default mongoose.model("Borrow", borrowSchema);
