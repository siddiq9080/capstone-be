import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_NAME,
    pass: process.env.PASS_KEY,
  },
});

export const mailobj = {
  from: process.env.MAIL_NAME,
  to: [],
  subject: "Reset Password",
  text: "Click on the below link to reset your password",
};
