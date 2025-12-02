import mongoose from "mongoose";

const fineSchema = new mongoose.Schema(
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
    Ma_Muon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrow",
      required: true,
    },
    Tien_Phat: {
      type: Number,
      required: true,
      default: 0,
    },
    Tong_Tien: {
      type: Number,
      required: true,
      default: 0,
    },
    Ngay_Hen_Tra: {
      type: Date,
      required: true,
    },
    Ngay_Tra_Thuc_Te: {
      type: Date,
      required: true,
    },
    So_Ngay_Tre: {
      type: Number,
      required: true,
    },
    Trang_Thai_Thanh_Toan: {
      type: String,
      enum: ["Chưa thanh toán", "Đã thanh toán"],
      default: "Chưa thanh toán",
    },
    Ngay_Thanh_Toan: {
      type: Date,
    },
    Ghi_Chu: {
      type: String,
    },
  },
  { collection: "Tien_Phat", timestamps: true, versionKey: false }
);

export default mongoose.model("Fine", fineSchema);
