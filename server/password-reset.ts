import { randomBytes } from "crypto";
import { sendEmail } from "./email";

export interface PasswordResetData {
  token: string;
  expiry: Date;
}

export function generatePasswordResetToken(): PasswordResetData {
  const token = randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // Token expires in 1 hour
  
  return { token, expiry };
}

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string
): Promise<void> {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : process.env.VITE_SERVER_URL || 'https://privycalc.com';
  
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-card {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #2563eb;
          margin: 0;
          font-size: 28px;
        }
        h2 {
          color: #1e293b;
          margin-top: 0;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background-color: #dc2626;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #b91c1c;
        }
        .link-text {
          color: #64748b;
          font-size: 14px;
          margin-top: 20px;
          word-break: break-all;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #64748b;
          font-size: 14px;
        }
        .divider {
          border-top: 1px solid #e2e8f0;
          margin: 30px 0;
        }
        .warning-box {
          background-color: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="logo">
            <h1>🔒 PrivyCalc</h1>
          </div>
          
          <h2>Hello ${fullName}!</h2>
          
          <p>We received a request to reset your password for your PrivyCalc account. If you made this request, click the button below to create a new password.</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <div class="divider"></div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p class="link-text">${resetLink}</p>
          
          <div class="warning-box">
            <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>This password reset link will expire in 1 hour</li>
              <li>If you didn't request a password reset, please ignore this email</li>
              <li>Your password will remain unchanged until you create a new one</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} PrivyCalc. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Hello ${fullName}!
    
    We received a request to reset your password for your PrivyCalc account. If you made this request, click the link below to create a new password.
    
    Reset your password:
    ${resetLink}
    
    IMPORTANT:
    - This password reset link will expire in 1 hour
    - If you didn't request a password reset, please ignore this email
    - Your password will remain unchanged until you create a new one
    
    © ${new Date().getFullYear()} PrivyCalc. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: "Reset Your Password - PrivyCalc",
    text: textContent,
    html: htmlContent,
  });
}

export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > new Date(expiry);
}
