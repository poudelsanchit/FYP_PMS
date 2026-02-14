import nodemailer from "nodemailer";
import { prisma } from "../prisma/prisma";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function generateOTP(email: string): Promise<string> {
  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Delete any existing OTP for this email
  await prisma.oTP.deleteMany({ where: { email } });

  // Create new OTP
  await prisma.oTP.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  return code;
}

export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p style="color: #666; font-size: 16px;">Your OTP verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
    },
  });

  if (!otp) return false;

  // Check if OTP has expired
  if (new Date() > otp.expiresAt) {
    await prisma.oTP.delete({ where: { id: otp.id } });
    return false;
  }

  // Delete OTP after successful verification
  await prisma.oTP.delete({ where: { id: otp.id } });

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  return true;
}
