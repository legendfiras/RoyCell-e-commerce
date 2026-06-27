import nodemailer from "nodemailer";
import { config } from "./config.js";

export const sendAdminOtpEmail = async (otp: string) => {
  if (!config.email.host || !config.email.user || !config.email.pass || !config.adminResetEmail) {
    throw new Error("Email OTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

  await transporter.sendMail({
    from: config.email.from,
    to: config.adminResetEmail,
    subject: "RoyCell Admin Password Reset Code",
    text: `Your RoyCell admin reset code is ${otp}. It expires in ${config.otpExpiryMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>RoyCell Admin Password Reset</h2>
        <p>Your reset code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code expires in ${config.otpExpiryMinutes} minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `
  });
};