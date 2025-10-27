import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, HelpCircle, MessageSquare, Shield, Smartphone, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Help() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6 safe-area-top">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Help & Support</h2>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Learn how to use PrivyCalc's secure messaging features and calculator interface.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Understand how we protect your messages and personal information.
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I send my first message?</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Open the calculator and enter your PIN code</li>
                    <li>Navigate to the Messaging section</li>
                    <li>Click "New Conversation" and enter the recipient's user code</li>
                    <li>Type your message and hit send!</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>What is a User Code?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    A User Code is your unique identifier in PrivyCalc. Share this code with people
                    you want to message. You can find your code in Settings. It's a short alphanumeric
                    code that others use to start conversations with you.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How does the calculator PIN work?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm mb-2">
                    Your PIN is a numeric code you enter through the calculator interface to access
                    secure messaging. To enter your PIN:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Type each digit on the calculator</li>
                    <li>Press the equals (=) button after each digit</li>
                    <li>Complete all digits of your PIN</li>
                    <li>The messaging interface will unlock automatically</li>
                  </ol>
                  <p className="text-sm mt-2 text-muted-foreground">
                    This unique method disguises your secure messaging as a normal calculator app.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What are the differences between Free and Premium?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">Free Plan:</p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>1 message per day</li>
                        <li>Text messages only</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Premium Plan ($29.99/year):</p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>Unlimited messages</li>
                        <li>Send images and videos</li>
                        <li>Priority support</li>
                      </ul>
                    </div>
                    <p className="text-muted-foreground italic">
                      Bonus: If one person in a conversation has Premium, both users can send unlimited messages!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>How do I upgrade to Premium on mobile?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>For Android/iOS users:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to Settings in the app</li>
                      <li>Find the "Subscription" card</li>
                      <li>Tap "Subscribe" to purchase through Google Play or App Store</li>
                      <li>Complete the payment in your app store</li>
                      <li>Your premium access activates immediately</li>
                    </ol>
                    <p className="text-muted-foreground mt-2">
                      Mobile subscriptions are managed through your device's app store and include automatic renewal.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Can I cancel my subscription?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Mobile Subscriptions:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li><strong>Android:</strong> Go to Google Play Store → Subscriptions → PrivyCalc → Cancel</li>
                      <li><strong>iOS:</strong> Go to Settings → [Your Name] → Subscriptions → PrivyCalc → Cancel</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      You'll keep premium access until the end of your billing period. After cancellation,
                      your subscription won't auto-renew.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>How do I restore my purchases?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm mb-2">
                    If you've purchased Premium but don't see it active:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to Settings</li>
                    <li>Scroll to the Subscription section</li>
                    <li>Tap "Restore Purchases"</li>
                    <li>Your premium status will sync from the app store</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is useful when switching devices or reinstalling the app.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Yes! PrivyCalc uses industry-standard security practices:
                  </p>
                  <ul className="list-disc list-inside ml-2 text-sm space-y-1 mt-2">
                    <li>All passwords are encrypted using scrypt hashing</li>
                    <li>Messages are stored securely in an encrypted database</li>
                    <li>The calculator interface provides stealth protection</li>
                    <li>Your PIN adds an extra layer of security</li>
                    <li>File uploads use secure cloud storage with access control</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>What if I forgot my password?</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to the login page</li>
                    <li>Click "Forgot Password?"</li>
                    <li>Enter your email address</li>
                    <li>Check your email for a password reset link</li>
                    <li>Create a new password</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    Reset links expire after 1 hour for security reasons.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger>Can I use PrivyCalc on multiple devices?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Yes! Your account works across all devices (web, Android, iOS). Simply log in with
                    your email and password on any device. Your messages and conversations will sync
                    automatically.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: Mobile subscriptions purchased on one platform work everywhere, but must be
                    managed through the original app store (Google Play or Apple App Store).
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Can't find the answer you're looking for? Our support team is here to help!
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong>{" "}
                <a 
                  href="mailto:support@privycalc.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-support-email"
                >
                  support@privycalc.com
                </a>
              </p>
              <p className="text-muted-foreground">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Mobile Apps</p>
                <p className="text-sm text-muted-foreground">
                  Download PrivyCalc from Google Play Store or Apple App Store for the best mobile experience.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Billing & Subscriptions</p>
                <p className="text-sm text-muted-foreground">
                  All subscription payments are processed securely through Google Play or Apple App Store.
                  We never store your payment information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button
          onClick={handleBack}
          variant="outline"
          className="w-full mt-6"
          data-testid="button-back-bottom"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
