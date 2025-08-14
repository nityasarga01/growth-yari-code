import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `"GrowthYari" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to GrowthYari!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to GrowthYari, ${name}!</h1>
        <p>We're excited to have you join our professional community.</p>
        <p>Get started by:</p>
        <ul>
          <li>Completing your profile</li>
          <li>Exploring professionals in your field</li>
          <li>Booking your first session</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Get Started
        </a>
      </div>
    `
  }),

  sessionBooked: (clientName: string, expertName: string, sessionTitle: string, scheduledAt: string) => ({
    subject: 'New Session Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">New Session Booking</h1>
        <p>Hi ${expertName},</p>
        <p>${clientName} has booked a session with you:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${sessionTitle}</h3>
          <p><strong>Scheduled:</strong> ${scheduledAt}</p>
          <p><strong>Client:</strong> ${clientName}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/sessions" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Session
        </a>
      </div>
    `
  }),

  connectionRequest: (senderName: string, receiverName: string, message: string) => ({
    subject: 'New Connection Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">New Connection Request</h1>
        <p>Hi ${receiverName},</p>
        <p>${senderName} wants to connect with you on GrowthYari.</p>
        ${message ? `<div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><em>"${message}"</em></p>
        </div>` : ''}
        <a href="${process.env.FRONTEND_URL}/connections" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Request
        </a>
      </div>
    `
  })
};