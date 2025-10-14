import { randomBytes } from "crypto";
import { sendEmail } from "./email";

export interface EmailVerificationData {
  token: string;
  expiry: Date;
}

export function generateVerificationToken(): EmailVerificationData {
  const token = randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // Token expires in 24 hours
  
  return { token, expiry };
}

export async function sendVerificationEmail(
  email: string,
  fullName: string,
  verificationToken: string
): Promise<void> {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : process.env.VITE_SERVER_URL || 'http://localhost:5000';
  
  const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
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
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="logo">
            <h1>🔒 Secure Messenger</h1>
          </div>
          
          <h2>Hello ${fullName}!</h2>
          
          <p>Thank you for registering with Secure Messenger. To complete your registration and start using our secure messaging platform, please verify your email address.</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>
          
          <div class="divider"></div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p class="link-text">${verificationLink}</p>
          
          <div class="divider"></div>
          
          <p><strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Secure Messenger. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Hello ${fullName}!
    
    Thank you for registering with Secure Messenger. To complete your registration and start using our secure messaging platform, please verify your email address.
    
    Click the link below to verify your email:
    ${verificationLink}
    
    This verification link will expire in 24 hours.
    
    If you didn't create an account with us, please ignore this email.
    
    © ${new Date().getFullYear()} Secure Messenger. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: "Verify Your Email - Secure Messenger",
    text: textContent,
    html: htmlContent,
  });
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  username: string
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Secure Messenger</title>
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
        .feature-list {
          background-color: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .feature-list li {
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #64748b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="logo">
            <h1>🔒 Secure Messenger</h1>
          </div>
          
          <h2>Welcome, ${fullName}!</h2>
          
          <p>Your email has been successfully verified. You're all set to start using Secure Messenger - the messaging app disguised as a calculator.</p>
          
          <div class="feature-list">
            <h3>What's Next?</h3>
            <ul>
              <li>✅ Your username: <strong>${username}</strong></li>
              <li>🔢 Set up your numeric password in Settings</li>
              <li>💬 Start secure conversations with other users</li>
              <li>🔐 Access your messages by entering your PIN on the calculator</li>
            </ul>
          </div>
          
          <p><strong>Stealth Mode:</strong> Your messaging app is disguised as a calculator. To access your messages, enter your numeric password and press "=" on the calculator interface.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Secure Messenger. All rights reserved.</p>
            <p>Need help? Contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome, ${fullName}!
    
    Your email has been successfully verified. You're all set to start using Secure Messenger - the messaging app disguised as a calculator.
    
    What's Next?
    - Your username: ${username}
    - Set up your numeric password in Settings
    - Start secure conversations with other users
    - Access your messages by entering your PIN on the calculator
    
    Stealth Mode: Your messaging app is disguised as a calculator. To access your messages, enter your numeric password and press "=" on the calculator interface.
    
    © ${new Date().getFullYear()} Secure Messenger. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to Secure Messenger! 🎉",
    text: textContent,
    html: htmlContent,
  });
}

export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > new Date(expiry);
}
