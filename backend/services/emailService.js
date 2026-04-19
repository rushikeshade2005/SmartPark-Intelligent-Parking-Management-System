const nodemailer = require('nodemailer');

// Create transporter — uses configured SMTP if available, falls back to Ethereal (fake) in dev
let transporter;

const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS &&
      process.env.SMTP_USER !== 'your-email@gmail.com') {
    // Real SMTP configured (Gmail or other provider)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`📧 Email configured with SMTP: ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
  } else {
    // Fallback to Ethereal for development — emails are captured, not delivered
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`📧 No SMTP configured — using Ethereal (fake). Emails won't be delivered.`);
    console.log(`📧 Configure SMTP_USER & SMTP_PASS in .env to send real emails.`);
  }
};

// Initialize on first use
const getTransporter = async () => {
  if (!transporter) await createTransporter();
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || '"SmartPark" <noreply@smartpark.com>',
      to,
      subject,
      html,
    });

    // In dev, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 Email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw — email failure shouldn't break the app flow
    return null;
  }
};

// ─── Email Templates ───────────────────────────────────────────────

const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'SmartPark — Reset Your Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#4f46e5;color:#fff;width:50px;height:50px;border-radius:12px;line-height:50px;font-size:24px;font-weight:bold;">P</div>
          <h2 style="color:#1e293b;margin:10px 0 0;">SmartPark</h2>
        </div>
        <h3 style="color:#1e293b;">Reset Your Password</h3>
        <p style="color:#64748b;">Hi ${user.name},</p>
        <p style="color:#64748b;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:25px 0;">
          <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
};

const sendBookingConfirmationEmail = async (user, booking, lot, slot) => {
  await sendEmail({
    to: user.email,
    subject: `SmartPark — Booking Confirmed #${booking._id.toString().slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#4f46e5;color:#fff;width:50px;height:50px;border-radius:12px;line-height:50px;font-size:24px;font-weight:bold;">P</div>
          <h2 style="color:#1e293b;margin:10px 0 0;">SmartPark</h2>
        </div>
        <h3 style="color:#22c55e;">✓ Booking Confirmed!</h3>
        <p style="color:#64748b;">Hi ${user.name}, your parking has been reserved.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:15px;margin:15px 0;">
          <table style="width:100%;color:#475569;font-size:14px;">
            <tr><td style="padding:4px 0;font-weight:600;">Parking Lot</td><td style="text-align:right;">${lot.name}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600;">Slot</td><td style="text-align:right;">${slot.slotNumber}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600;">Vehicle</td><td style="text-align:right;">${booking.vehicleNumber}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600;">Start</td><td style="text-align:right;">${new Date(booking.startTime).toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600;">End</td><td style="text-align:right;">${new Date(booking.endTime).toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600;">Duration</td><td style="text-align:right;">${booking.duration} hrs</td></tr>
            <tr><td style="padding:8px 0 0;font-weight:700;font-size:16px;border-top:1px solid #e2e8f0;">Total</td><td style="text-align:right;font-weight:700;font-size:16px;border-top:1px solid #e2e8f0;color:#4f46e5;">₹${booking.totalAmount}</td></tr>
          </table>
        </div>
        <p style="color:#94a3b8;font-size:12px;">Show your QR code at the parking gate for entry.</p>
      </div>
    `,
  });
};

const sendCancellationEmail = async (user, booking, lotName) => {
  await sendEmail({
    to: user.email,
    subject: `SmartPark — Booking Cancelled`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#4f46e5;color:#fff;width:50px;height:50px;border-radius:12px;line-height:50px;font-size:24px;font-weight:bold;">P</div>
          <h2 style="color:#1e293b;margin:10px 0 0;">SmartPark</h2>
        </div>
        <h3 style="color:#ef4444;">Booking Cancelled</h3>
        <p style="color:#64748b;">Hi ${user.name}, your booking at <strong>${lotName}</strong> has been cancelled.</p>
        <p style="color:#64748b;">If a payment was made, a refund of <strong>₹${booking.totalAmount}</strong> will be processed.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;">If you didn't cancel this booking, please contact support.</p>
      </div>
    `,
  });
};

const sendContactReplyEmail = async (contact) => {
  await sendEmail({
    to: contact.email,
    subject: `SmartPark — Reply to your message: ${contact.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#4f46e5;color:#fff;width:50px;height:50px;border-radius:12px;line-height:50px;font-size:24px;font-weight:bold;">P</div>
          <h2 style="color:#1e293b;margin:10px 0 0;">SmartPark</h2>
        </div>
        <h3 style="color:#1e293b;">We replied to your message</h3>
        <p style="color:#64748b;">Hi ${contact.name},</p>
        <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px;margin:15px 0;border-radius:4px;">
          <p style="color:#166534;margin:0;">${contact.adminReply}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;">Original message: "${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}"</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendContactReplyEmail,
};
