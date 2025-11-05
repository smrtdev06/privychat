import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: January 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-lg border">
          <div className="p-8 prose prose-slate max-w-none dark:prose-invert">
            <p className="lead text-lg text-muted-foreground mb-6">
              NewhomePage delivers analytics and other data-related services to small and medium-sized businesses, marketing 
              companies, enterprises, and other organizations. The data is typically used by our customers for research, 
              validation and verification services, marketing communications, targeted advertising, and similar uses.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-1">California Residents</h4>
                <p className="text-sm text-muted-foreground">See our California Privacy Notice</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-1">Colorado Residents</h4>
                <p className="text-sm text-muted-foreground">See our Colorado Privacy Notice</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-1">Connecticut Residents</h4>
                <p className="text-sm text-muted-foreground">See our Connecticut Privacy Notice</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-1">Virginia Residents</h4>
                <p className="text-sm text-muted-foreground">See our Virginia Privacy Notice</p>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Scope of this Privacy Policy</h2>
              <p className="text-muted-foreground mb-4">
                NewhomePage has created this privacy policy to demonstrate its commitment to privacy. This privacy policy 
                applies to all visitors (individuals or businesses) to NewhomePage.com and all NewhomePage subsidiaries and 
                describes how we use and share the personal information that we gather on our website.
              </p>
              <p className="text-muted-foreground mb-4">
                NewhomePage does not knowingly collect personal information about children. If we discover we have collected 
                personal information from an individual under 18, we will delete that information from our systems.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Opt-Out</h2>
              <div className="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 p-4">
                <p className="text-sm">
                  NewhomePage appreciates and understands the importance of privacy. Any individual visitor (consumer or business) 
                  to NewhomePage can choose to Opt-Out, so information about them is not shared with NewhomePage customers. 
                  To "Opt-Out", please send an email to <strong>sales@NewhomePage.com</strong> with your email address, full name, 
                  street address, date of birth and phone number.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Collection of Information on Our Website</h2>
              
              <h3 className="text-xl font-medium mt-4 mb-3">Information We Collect Directly</h3>
              <p className="text-muted-foreground mb-4">
                NewhomePage collects personal information when visitors provide such information on our website, such as during 
                registration, to request services, or through contact forms. We also may collect payment and authentication 
                information depending on the services that you request from us.
              </p>

              <h3 className="text-xl font-medium mt-4 mb-3">Information We Collect Automatically</h3>
              <p className="text-muted-foreground mb-4">
                NewhomePage automatically receives and stores certain types of information whenever a visitor interacts with the 
                NewhomePage website. For example, we automatically receive and record certain "traffic data" on our server logs, 
                including a visitor's IP address, the page requested, and interactions with the NewhomePage website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use the Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We use your information to provide our services and as described below:
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">1</div>
                  <div>
                    <h4 className="font-medium">Customer Service</h4>
                    <p className="text-sm text-muted-foreground">To contact subscribers regarding their account status and changes to subscriber agreements.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">2</div>
                  <div>
                    <h4 className="font-medium">Marketing</h4>
                    <p className="text-sm text-muted-foreground">To contact customers about special promotions, product release notices, and other information we think may be of interest.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">3</div>
                  <div>
                    <h4 className="font-medium">Optimization and Personalization</h4>
                    <p className="text-sm text-muted-foreground">To tailor the content and information that we may send or display, and to personalize your experiences.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">4</div>
                  <div>
                    <h4 className="font-medium">Improve and Analyze Services</h4>
                    <p className="text-sm text-muted-foreground">To assess how customers use our services, to improve our services, and to develop new products.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Share the Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We may share your information in the following circumstances:
              </p>
              
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">•</span> With customers who hire us to perform analytics on their behalf</li>
                <li className="flex gap-2"><span className="text-primary">•</span> In connection with business transfers or mergers</li>
                <li className="flex gap-2"><span className="text-primary">•</span> In response to legal process or to comply with the law</li>
                <li className="flex gap-2"><span className="text-primary">•</span> To protect us and others from illegal activities or fraud</li>
                <li className="flex gap-2"><span className="text-primary">•</span> Aggregate or de-identified information for marketing, advertising, or research</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Security</h2>
              <p className="text-muted-foreground mb-4">
                NewhomePage uses systems and procedures to safeguard its data. However, as no protection measure is 100% secure, 
                we cannot guarantee against unauthorized or illegal access, disclosure, modification, or loss of data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookies and Other Tracking Technologies</h2>
              <p className="text-muted-foreground mb-4">
                We may collect information through our website using cookies and other technologies:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Small unique strings of letters and numbers stored on your computer to recognize repeat visitors and track usage behavior.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Third-Party Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    We use automated devices like Google Analytics to evaluate usage of our website and services.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Do-Not-Track</h4>
                  <p className="text-sm text-muted-foreground">
                    Currently, our website does not honor browser Do-Not-Track signals.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">To Unsubscribe from Our Communications</h2>
              <p className="text-muted-foreground mb-4">
                You may unsubscribe from our marketing communications by clicking on the "unsubscribe" link located on the 
                bottom of our emails, or by sending us email at <strong>sales@NewhomePage.com</strong> with Subject: Unsubscribe.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Updates to the Privacy Policy</h2>
              <p className="text-muted-foreground mb-4">
                NewhomePage may make changes to this privacy statement from time to time. Notice will be provided on this page 
                to any material changes made to the policy.
              </p>
            </section>

            <section className="mt-8 pt-6 border-t">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions or comments about this Privacy Statement, please contact us at:
              </p>
              <div className="bg-muted p-6 rounded-lg space-y-2">
                <p className="font-medium text-foreground">NewHomePage LLC</p>
                <p className="text-muted-foreground">10053 Whittwood Dr #1201</p>
                <p className="text-muted-foreground">Whittier, CA 90603</p>
                <p className="text-muted-foreground">Phone: 877-399-1476</p>
                <p className="text-muted-foreground">FAX: 626-608-2082</p>
                <p className="text-muted-foreground">Email: sales@NewhomePage.com</p>
                <p className="text-muted-foreground">Website: www.NewhomePage.com</p>
              </div>
            </section>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>Copyright © 2023-2025 NewHomePage LLC. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
