import nodemailer from "nodemailer";

// Cấu hình email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail", // Hoặc 'hotmail', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER || "your-email@gmail.com",
      pass: process.env.EMAIL_PASSWORD || "your-app-password",
    },
  });
};

export default createTransporter;
