import createTransporter from "../config/email.js";

class EmailService {
  // Gửi email chào mừng khi đăng ký
  static async sendWelcomeEmail(readerEmail, readerName) {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Thư Viện Online" <${process.env.EMAIL_USER}>`,
        to: readerEmail,
        subject: "Chào mừng bạn đến với Thư viện",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Chào mừng ${readerName}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại thư viện của chúng tôi.</p>
            <p>Bạn có thể bắt đầu mượn sách và khám phá bộ sưu tập của chúng tôi.</p>
            <p style="color: #666; font-size: 14px;">
              <strong>Lưu ý:</strong> Vui lòng giữ thông tin tài khoản an toàn.
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${readerEmail}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  // Gửi email nhắc nhở trả sách
  static async sendReturnReminderEmail(
    readerEmail,
    readerName,
    bookTitle,
    dueDate
  ) {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Thư Viện Online" <${process.env.EMAIL_USER}>`,
        to: readerEmail,
        subject: "Thông báo: Sách đã quá hạn trả",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F44336;">⚠️ Sách đã quá hạn trả</h2>
            <p>Xin chào ${readerName},</p>
            <p>Sách <strong>"${bookTitle}"</strong> mà bạn đang mượn đã quá hạn trả.</p>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Ngày hẹn trả:</strong> <span style="color: #F44336;">${new Date(
                dueDate
              ).toLocaleDateString("vi-VN")}</span></p>
              <p style="margin: 5px 0;"><strong>⚠️ Lưu ý:</strong> Bạn sẽ bị phạt 10,000 VNĐ/ngày cho mỗi ngày trả muộn.</p>
            </div>
            <p style="color: #d32f2f; font-weight: bold;">Vui lòng trả sách ngay để tránh bị phạt thêm!</p>
            <p>Liên hệ thư viện nếu bạn cần hỗ trợ.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Return reminder email sent to ${readerEmail}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending return reminder email:", error);
      return { success: false, error: error.message };
    }
  }

  // Gửi email thông báo phạt
  static async sendFineNotificationEmail(
    readerEmail,
    readerName,
    fineAmount,
    reason
  ) {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Thư Viện Online" <${process.env.EMAIL_USER}>`,
        to: readerEmail,
        subject: "Thông báo: Bạn có khoản phạt cần thanh toán",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F44336;">Thông báo phạt</h2>
            <p>Xin chào ${readerName},</p>
            <p>Bạn có một khoản phạt cần thanh toán:</p>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Lý do:</strong> ${reason}</p>
              <p style="margin: 5px 0;"><strong>Số tiền:</strong> <span style="color: #F44336; font-size: 20px; font-weight: bold;">${fineAmount.toLocaleString(
                "vi-VN"
              )} VNĐ</span></p>
            </div>
            <p>Vui lòng thanh toán khoản phạt tại thư viện trong thời gian sớm nhất.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Fine notification email sent to ${readerEmail}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending fine notification email:", error);
      return { success: false, error: error.message };
    }
  }

  // Gửi email xác nhận mượn sách
  static async sendBorrowConfirmationEmail(
    readerEmail,
    readerName,
    bookTitle,
    borrowDate,
    dueDate
  ) {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Thư Viện Online" <${process.env.EMAIL_USER}>`,
        to: readerEmail,
        subject: "Xác nhận: Mượn sách thành công",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">Xác nhận mượn sách</h2>
            <p>Xin chào ${readerName},</p>
            <p>Bạn đã mượn sách thành công:</p>
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Tên sách:</strong> ${bookTitle}</p>
              <p style="margin: 5px 0;"><strong>Ngày mượn:</strong> ${new Date(
                borrowDate
              ).toLocaleDateString("vi-VN")}</p>
              <p style="margin: 5px 0;"><strong>Ngày hết hạn:</strong> ${new Date(
                dueDate
              ).toLocaleDateString("vi-VN")}</p>
            </div>
            <p>Vui lòng trả sách đúng hạn để tránh bị phạt.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Borrow confirmation email sent to ${readerEmail}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending borrow confirmation email:", error);
      return { success: false, error: error.message };
    }
  }

  // Gửi email xác nhận trả sách
  static async sendReturnConfirmationEmail(
    readerEmail,
    readerName,
    bookTitle,
    returnDate
  ) {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Thư Viện Online" <${process.env.EMAIL_USER}>`,
        to: readerEmail,
        subject: "Xác nhận: Trả sách thành công",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Xác nhận trả sách</h2>
            <p>Xin chào ${readerName},</p>
            <p>Bạn đã trả sách thành công:</p>
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Tên sách:</strong> ${bookTitle}</p>
              <p style="margin: 5px 0;"><strong>Ngày trả:</strong> ${new Date(
                returnDate
              ).toLocaleDateString("vi-VN")}</p>
            </div>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của thư viện.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Return confirmation email sent to ${readerEmail}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending return confirmation email:", error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
