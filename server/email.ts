import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not found. Email functionality will not work.");
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    throw new Error("SendGrid is not configured. Missing API key or from email.");
  }

  const msg: any = {
    to: options.to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: options.subject,
  };

  if (options.text) {
    msg.text = options.text;
  }
  if (options.html) {
    msg.html = options.html;
  }

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error: any) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("SendGrid error body:", error.response.body);
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Test function to verify SendGrid setup
export async function testSendGridSetup(): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY is not set");
    return false;
  }
  
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error("SENDGRID_FROM_EMAIL is not set");
    return false;
  }

  console.log("SendGrid credentials found:");
  console.log("- API Key:", process.env.SENDGRID_API_KEY.substring(0, 10) + "...");
  console.log("- From Email:", process.env.SENDGRID_FROM_EMAIL);
  
  return true;
}
