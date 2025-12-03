import Staff from "../models/staff.model.js";
import Reader from "../models/reader.model.js";

// Đăng ký cho độc giả (Reader)
export const readerRegister = async (req, res) => {
  try {
    const { Ho_Lot, Ten, Password, Dien_Thoai, Email, Dia_Chi } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!Ho_Lot || !Ten || !Password) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    // Kiểm tra email đã tồn tại chưa (nếu có email)
    if (Email) {
      const existingEmail = await Reader.findOne({ Email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
    }

    // Tự động sinh Mã độc giả
    const lastReader = await Reader.findOne({}).sort({ _id: -1 }).limit(1);
    let newMa_Doc_Gia = "DG001";
    if (lastReader && lastReader.Ma_Doc_Gia) {
      const currentNumber = parseInt(lastReader.Ma_Doc_Gia.replace("DG", ""));
      newMa_Doc_Gia = "DG" + String(currentNumber + 1).padStart(3, "0");
    }

    // Tạo độc giả mới
    const newReader = new Reader({
      Ma_Doc_Gia: newMa_Doc_Gia,
      Ho_Lot,
      Ten,
      Password,
      Dien_Thoai: Dien_Thoai || "",
      Email: Email || "",
      Dia_Chi: Dia_Chi || "",
      Tinh_Trang: "1", // Mặc định kích hoạt
      Ngay_Dang_Ky: new Date(),
    });

    // Lưu vào database
    await newReader.save();

    res.status(201).json({
      message: "Đăng ký thành công",
      reader: {
        _id: newReader._id,
        Ma_Doc_Gia: newReader.Ma_Doc_Gia,
        Ho_Lot: newReader.Ho_Lot,
        Ten: newReader.Ten,
        Email: newReader.Email,
        Dien_Thoai: newReader.Dien_Thoai,
        Dia_Chi: newReader.Dia_Chi,
        Ngay_Dang_Ky: newReader.Ngay_Dang_Ky,
        Tinh_Trang: newReader.Tinh_Trang,
      },
    });
  } catch (error) {
    console.error("[Reader Register] Error:", error.message);
    res.status(500).json({ message: "Lỗi khi đăng ký", error: error.message });
  }
};

// Đăng nhập cho admin (Staff)
export const staffLogin = async (req, res) => {
  try {
    const { Ma_Nhan_Vien, Password } = req.body;

    // Kiểm tra nhân viên có tồn tại không
    const staff = await Staff.findOne({ Ma_Nhan_Vien });
    if (!staff) {
      return res.status(401).json({ message: "Mã nhân viên không tồn tại" });
    }

    // Kiểm tra password
    const isPasswordValid = await staff.comparePassword(Password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // Cho phép cả admin và staff đăng nhập
    if (staff.Role !== "admin" && staff.Role !== "staff") {
      return res.status(403).json({ message: "Không có quyền truy cập hệ thống quản lý" });
    }

    // Trả về thông tin nhân viên (không trả password)
    const staffData = {
      _id: staff._id,
      Ma_Nhan_Vien: staff.Ma_Nhan_Vien,
      Ho_Ten: staff.Ho_Ten,
      Role: staff.Role,
    };

    res.status(200).json({
      message: "Đăng nhập thành công",
      staff: staffData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi đăng nhập", error: error.message });
  }
};

// Đăng nhập cho độc giả (Reader)
export const readerLogin = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    console.log("[Reader Login] Request:", { Email, Password });

    // Kiểm tra độc giả có tồn tại không (tìm bằng Email)
    const reader = await Reader.findOne({ Email });
    if (!reader) {
      console.log("[Reader Login] Reader not found:", Email);
      return res.status(401).json({ message: "Email không tồn tại" });
    }

    console.log("[Reader Login] Reader found:", reader.Ma_Doc_Gia);
    console.log(
      "[Reader Login] Stored password hash:",
      reader.Password?.substring(0, 20) + "..."
    );
    console.log("[Reader Login] Comparing with input password:", Password);

    // Kiểm tra password
    const isPasswordValid = await reader.comparePassword(Password);
    console.log("[Reader Login] Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // Trả về thông tin độc giả
    const readerData = {
      _id: reader._id,
      Ma_Doc_Gia: reader.Ma_Doc_Gia,
      Ho_Lot: reader.Ho_Lot,
      Ten: reader.Ten,
      Dien_Thoai: reader.Dien_Thoai,
      Dia_Chi: reader.Dia_Chi,
      Email: reader.Email,
      Ngay_Dang_Ky: reader.Ngay_Dang_Ky,
      Tinh_Trang: reader.Tinh_Trang,
    };

    res.status(200).json({
      message: "Đăng nhập thành công",
      reader: readerData,
    });
  } catch (error) {
    console.log("[Reader Login] Error:", error.message);
    res
      .status(500)
      .json({ message: "Lỗi khi đăng nhập", error: error.message });
  }
};

// Lấy thông tin nhân viên hiện tại (dùng cho verify session admin)
export const getCurrentStaff = async (req, res) => {
  try {
    const staffId = req.body.staffId;
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }

    const staffData = {
      _id: staff._id,
      Ma_Nhan_Vien: staff.Ma_Nhan_Vien,
      Ho_Ten: staff.Ho_Ten,
      Role: staff.Role,
    };

    res.status(200).json(staffData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin", error: error.message });
  }
};

// Lấy thông tin độc giả hiện tại (dùng cho verify session user)
export const getCurrentReader = async (req, res) => {
  try {
    const readerId = req.body.readerId;
    const reader = await Reader.findById(readerId);

    if (!reader) {
      return res.status(404).json({ message: "Độc giả không tồn tại" });
    }

    const readerData = {
      _id: reader._id,
      Ma_Doc_Gia: reader.Ma_Doc_Gia,
      Ho_Lot: reader.Ho_Lot,
      Ten: reader.Ten,
      Dien_Thoai: reader.Dien_Thoai,
      Dia_Chi: reader.Dia_Chi,
      Email: reader.Email,
      Ngay_Dang_Ky: reader.Ngay_Dang_Ky,
      Tinh_Trang: reader.Tinh_Trang,
    };

    res.status(200).json(readerData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin", error: error.message });
  }
};
