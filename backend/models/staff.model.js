import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const staffSchema = new mongoose.Schema(
  {
    Ma_Nhan_Vien: { type: String, required: true, unique: true },
    Ho_Ten: { type: String, required: true },
    Password: { type: String, required: true },
    Email: { type: String },
    Chuc_Vu: { type: String },
    Dia_Chi: { type: String },
    So_Dien_Thoai: { type: String },
    Ngay_Sinh: { type: Date },
    Role: { type: String, enum: ["admin", "staff"], default: "staff" },
  },
  { collection: "Nhan_Vien", timestamps: true, versionKey: false }
);

// Hash password trước khi lưu
staffSchema.pre("save", async function (next) {
  if (!this.isModified("Password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.Password = await bcrypt.hash(this.Password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method kiểm tra password
staffSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.Password);
};

export default mongoose.model("Staff", staffSchema);
