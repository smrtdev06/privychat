import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Scale, Shield } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const LEGAL_ACCEPTANCE_KEY = "legal_terms_accepted";

// Helper functions for cross-platform storage
async function getStoredValue(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

// Privacy Policy Content
const PRIVACY_POLICY = `PrivyCalc Privacy Policy

Effective Date: ${new Date().toLocaleDateString()}

PrivyCalc ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.

1. Information We Collect

Account Information:
- Username, email address, and phone number
- Password (encrypted and never stored in plain text)
- Full name and user code

Message Content:
- Text messages between users
- Media files (images, videos, voice messages) uploaded by you
- Message metadata (timestamps, read status)

Usage Information:
- App usage patterns and features accessed
- Device information (model, operating system)
- IP address and connection information

Subscription Information:
- Subscription type (free or premium)
- Payment information processed through app store providers
- Subscription renewal status

2. How We Use Your Information

We use your information to:
- Provide secure messaging services
- Authenticate and manage your account
- Process subscription upgrades and premium features
- Send verification emails and important account notifications
- Improve app functionality and user experience
- Prevent fraud and ensure platform security

3. Data Storage and Security

- All passwords are hashed using industry-standard encryption
- Messages are stored securely in our database
- Media files are stored in secure cloud storage with access controls
- We implement security measures to protect against unauthorized access
- Sessions use secure cookies and CSRF protection

4. Information Sharing

We do NOT sell your personal information. We may share information only in these limited cases:
- With your consent
- To comply with legal obligations
- To protect our rights and prevent fraud
- With service providers (email, cloud storage) under strict confidentiality agreements

5. Your Data Rights

You have the right to:
- Access your personal information
- Delete your account and associated data
- Opt-out of marketing communications
- Export your data
- Update or correct your information

To exercise these rights, contact us at support@PrivyCalc.com

6. Data Retention

- Active accounts: Data retained while account is active
- Deleted accounts: Data permanently deleted within 30 days
- Messages: Retained until deleted by users
- Backup copies: Removed within 90 days of account deletion

7. Children's Privacy

PrivyCalc is not intended for users under 18. We do not knowingly collect information from children. If we discover we have collected data from someone under 18, we will delete it immediately.

8. Third-Party Services

We use third-party services for:
- Email delivery (SendGrid)
- Cloud storage (Google Cloud Storage)
- Mobile payments (Google Play, Apple App Store)

Each service has its own privacy policy governing their use of your information.

9. International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data.

10. California Privacy Rights (CCPA)

California residents have additional rights:
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt-out of sale of personal information (we don't sell data)
- Right to non-discrimination for exercising privacy rights

11. European Privacy Rights (GDPR)

EU residents have rights including:
- Right of access and portability
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to object to processing

12. Cookies and Tracking

We use:
- Session cookies for authentication
- Local storage for app preferences
- No third-party tracking or advertising cookies

13. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification.

14. Contact Us

For privacy questions or concerns:
Email: privacy@PrivyCalc.com
Website: https://PrivyCalc.com
`;

// Terms of Use Content
const TERMS_OF_USE = `PrivyCalc Terms of Use

Effective Date: ${new Date().toLocaleDateString()}

Welcome to PrivyCalc. By using our application, you agree to these Terms of Use.

1. Acceptance of Terms

By creating an account or using PrivyCalc, you agree to be bound by these Terms. If you don't agree, don't use our services.

2. Description of Service

PrivyCalc is a secure messaging application disguised as a calculator. Features include:
- End-to-end encrypted messaging
- Calculator interface for privacy
- Media sharing (images, videos, voice messages)
- Premium subscription options
- User discovery via user codes

3. Eligibility

You must be at least 18 years old to use PrivyCalc. By using our service, you represent that you meet this age requirement.

4. Account Registration

- You must provide accurate and complete information
- You are responsible for maintaining account security
- You must not share your account credentials
- One account per person
- We reserve the right to terminate accounts that violate these terms

5. Acceptable Use

You agree NOT to:
- Use PrivyCalc for illegal activities
- Harass, threaten, or harm other users
- Share content that is illegal, harmful, or violates others' rights
- Attempt to hack, compromise, or disrupt the service
- Create multiple accounts to abuse free tier limits
- Impersonate others or misrepresent your identity
- Spam or send unsolicited bulk messages
- Share child sexual abuse material (zero tolerance)
- Distribute malware or viruses

6. Content and Messages

- You own the content you create and share
- You grant us limited rights to store and transmit your messages
- We may remove content that violates these terms
- We don't monitor private messages unless required by law
- Deleted messages are permanently removed from our servers

7. Intellectual Property

- PrivyCalc name, logo, and design are our property
- You may not copy, modify, or distribute our intellectual property
- User-generated content remains your property

8. Subscriptions and Payments

Free Tier:
- Limited to 1 message per day
- Unlimited if either user in conversation has premium

Premium Subscription:
- Unlimited messaging
- Processed through App Store or Google Play
- Subject to platform payment terms
- Automatic renewal unless cancelled
- No refunds for partial subscription periods

9. Shared Premium Benefits

If either user in a conversation has premium, both users can send unlimited messages to each other.

10. Third-Party Services

- Payments processed by Apple App Store and Google Play
- Email services provided by SendGrid
- Cloud storage by Google Cloud Platform
- We're not responsible for third-party service issues

11. Privacy and Data

- Your privacy is important to us
- See our Privacy Policy for details on data handling
- We don't sell your personal information
- We use industry-standard security measures

12. Termination

We may suspend or terminate your account if you:
- Violate these Terms of Use
- Engage in illegal activity
- Abuse the service or other users
- Fail to pay for premium subscriptions

You may delete your account at any time from Settings.

13. Disclaimers

- PrivyCalc is provided "AS IS" without warranties
- We don't guarantee uninterrupted or error-free service
- We're not liable for data loss or service interruptions
- Use at your own risk

14. Limitation of Liability

To the maximum extent permitted by law:
- We're not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount you paid in the last 12 months
- Some jurisdictions don't allow these limitations

15. Indemnification

You agree to indemnify and hold PrivyCalc harmless from claims arising from:
- Your use of the service
- Your violation of these terms
- Your violation of others' rights

16. Changes to Terms

We may modify these Terms at any time. Continued use after changes constitutes acceptance.

17. Governing Law

These Terms are governed by the laws of the State of California, USA.

18. Dispute Resolution

Disputes will be resolved through binding arbitration in California, not in court, except for small claims court matters.

19. Severability

If any provision is found unenforceable, the remaining provisions continue in full effect.

20. Contact

Questions about these Terms?
Email: legal@PrivyCalc.com
Website: https://PrivyCalc.com

By using PrivyCalc, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy.
`;

interface LegalDialogProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  trigger?: React.ReactNode;
  dataTestId?: string;
}

function LegalDialog({ title, icon, content, trigger, dataTestId }: LegalDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild data-testid={dataTestId}>
        {trigger || (
          <Button variant="link" className="text-sm h-auto p-0">
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// For desktop/tablet - inline links
export function PCLegalLinks() {
  return (
    <div className="flex gap-4 text-sm text-muted-foreground justify-center" data-testid="legal-links">
      <LegalDialog
        title="Privacy Policy"
        icon={<Shield className="w-4 h-4" />}
        content={PRIVACY_POLICY}
        dataTestId="link-privacy-policy"
      />
      <span>•</span>
      <LegalDialog
        title="Terms of Use"
        icon={<Scale className="w-4 h-4" />}
        content={TERMS_OF_USE}
        dataTestId="link-terms-of-use"
      />
    </div>
  );
}

// For mobile - modal with buttons
export function MobileLegalModal() {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already accepted legal terms
    const checkAcceptance = async () => {
      try {
        const hasAccepted = await getStoredValue(LEGAL_ACCEPTANCE_KEY);
        if (!hasAccepted) {
          setOpen(true);
        } else {
          setAccepted(true);
        }
      } catch (error) {
        console.error("Error checking legal acceptance:", error);
        // Default to showing dialog on error
        setOpen(true);
      } finally {
        setLoading(false);
      }
    };

    checkAcceptance();
  }, []);

  const handleAccept = async () => {
    try {
      await setStoredValue(LEGAL_ACCEPTANCE_KEY, "true");
      setAccepted(true);
      setOpen(false);
    } catch (error) {
      console.error("Error saving legal acceptance:", error);
    }
  };

  // Don't render anything while checking or if already accepted
  if (loading || accepted) {
    return null;
  }

  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-md" 
        data-testid="modal-legal-acceptance"
        hideCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to PrivyCalc</DialogTitle>
          <DialogDescription>
            Please review and accept our legal terms to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <LegalDialog
            title="Privacy Policy"
            icon={<Shield className="w-4 h-4" />}
            content={PRIVACY_POLICY}
            trigger={
              <Button variant="outline" className="w-full justify-start" data-testid="button-view-privacy">
                <FileText className="w-4 h-4 mr-2" />
                View Privacy Policy
              </Button>
            }
          />

          <LegalDialog
            title="Terms of Use"
            icon={<Scale className="w-4 h-4" />}
            content={TERMS_OF_USE}
            trigger={
              <Button variant="outline" className="w-full justify-start" data-testid="button-view-terms">
                <Scale className="w-4 h-4 mr-2" />
                View Terms of Use
              </Button>
            }
          />

          <Button
            onClick={handleAccept}
            className="w-full"
            data-testid="button-accept-legal"
          >
            Accept and Continue
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By clicking "Accept and Continue", you agree to our Terms of Use and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
