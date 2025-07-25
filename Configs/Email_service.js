import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Create reusable transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. General sendMail function
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"LabSync Team" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }
};

// 3. Send OTP Email
export const sendOtpEmail = async (toEmail, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50;">LabSync Verification Code</h2>
      <p>Use the code below to verify your account:</p>
      <h1 style="letter-spacing: 3px;">${otp}</h1>
      <p style="font-size: 14px; color: #777;">This OTP will expire in 50 minutes.</p>
    </div>
  `;
  await sendMail(toEmail, "Your LabSync OTP Code", html);
};

// 4. Send Password Reset Email
export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50;">Reset Your LabSync Password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="color: #4CAF50;">Reset Password</a>
      <p style="font-size: 14px; color: #777;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  await sendMail(toEmail, "LabSync Password Reset", html);
};

// 5. Send Technician Invitation Email
export const sendTechnicianInvitationEmail = async (toEmail, invitationLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50;">LabSync Technician Invitation</h2>
      <p>You have been invited to join LabSync as a technician.</p>
      <p>Click the link below to accept the invitation and set your password:</p>
      <a href="${invitationLink}" style="display: inline-block; margin-top: 10px; padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
      <p style="font-size: 14px; color: #777;">This link will expire in 24 hours.</p>
    </div>
  `;
  await sendMail(toEmail, "You're Invited to Join LabSync as a Technician", html);
};

// 6. Notify Lab Test Result by Email
export const notifyResultByEmail = async ({ name, email, result, testName }) => {
  const html = `
    <h3>Dear ${name},</h3>
    <p>Your lab test result for <strong>${testName}</strong> is now available.</p>
    <pre>${result}</pre>
    <p>Thank you for using LabSync.</p>
  `;
  await sendMail(email, `Lab Test Result for ${testName}`, html);
};

// Send Appointment Confirmation Email
export const sendAppointmentConfirmationEmail = async ({ name, email, testName, appointmentDate }) => {
  // Format date nicely
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Split test names into list items (if applicable)
  const formattedTests = testName
    ? testName.split(',').map(test => `<li>${test.trim()}</li>`).join('')
    : '<li>Not specified</li>';

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50;">Lab Appointment Confirmed</h2>
      <p>Dear ${name},</p>
      <p>Your lab appointment has been successfully booked. Below are the details:</p>
      <ul>
        <li><strong>Date & Time:</strong> ${formattedDate}</li>
        <li><strong>Test(s):</strong>
          <ul>${formattedTests}</ul>
        </li>
      </ul>
      <p>Please arrive at least 10 minutes early and bring any required documents or ID.</p>
      <p style="font-size: 14px; color: #777;">Thank you for choosing <strong>LabSync</strong>.</p>
    </div>
  `;

  await sendMail(email, "Your Lab Appointment is Confirmed", html);
};
