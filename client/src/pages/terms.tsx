import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
              <p className="text-muted-foreground">Last updated: January 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-lg border">
          <div className="p-8 prose prose-slate max-w-none dark:prose-invert">
            <h2 className="text-2xl font-semibold mb-4">NewHomePage LLC Hosted Services License Agreement</h2>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm">
                THIS LICENSE AGREEMENT ("AGREEMENT") IS A LEGAL AGREEMENT BETWEEN YOU ("YOU", "YOUR") AND NewHomePage ANALYTICS, 
                A CALIFORNIA LLC CORPORATION WITH ITS PRINCIPAL OFFICE LOCATED AT 10053 Whittwood Dr #1201 Whittier, CA 90603 ("NewHomePage"). 
                BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE REVIEWED AND ACCEPT THIS AGREEMENT AND AGREE THAT YOU ARE LEGALLY 
                BOUND BY ITS TERMS.
              </p>
            </div>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3">1. Scope, Grant of License</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">1.1 Scope</h4>
              <p className="text-muted-foreground mb-4">
                This Agreement governs your access to and use of the NewHomePage LLC Platform (NewHomePage Paid Products, NewHomePage LLC 
                or any other NewHomePage product or service) and Licensed Materials identified in your Ordering Document.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">1.2 Access and Use License</h4>
              <p className="text-muted-foreground mb-4">
                Subject to your compliance with the terms and conditions of this Agreement, NewHomePage hereby grants you and your 
                Authorized Users, during the Term of this Agreement, a non-exclusive license to access and use the NewHomePage LLC 
                Platform and to download and use the Licensed Materials.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">1.3 API</h4>
              <p className="text-muted-foreground mb-4">
                If your applicable Ordering Document permits you to use NewHomePage's application programming interface to build 
                applications that are compatible with the NewHomePage Platform (the "API"), we grant you an additional limited, 
                revocable, non-transferable, non-exclusive, non-sublicensable license to access and use the API.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">1.4 Third Party Applications</h4>
              <p className="text-muted-foreground mb-4">
                NewHomePage LLC is not responsible for and does not endorse any Third Party Applications, services or websites 
                linked to by the NewHomePage LLC Platform.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3">2. Fees & Taxes</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">2.1 Fees and Payment</h4>
              <p className="text-muted-foreground mb-4">
                You shall pay all fees stated in the Ordering Document (the "Subscription Fee"). All Subscription Fees are due upon 
                execution of the Ordering Document and payable on the terms set forth therein.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">2.2 Remedies for Non-Payment</h4>
              <p className="text-muted-foreground mb-4">
                In the event that you fail to timely make any payment of Subscription Fees, NewHomePage LLC may restrict or suspend 
                your access to the NewHomePage LLC Platform until all past-due payments are made.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">2.3 Taxes</h4>
              <p className="text-muted-foreground mb-4">
                You are responsible for any applicable taxes, including sales, use, levies, duties, or any value added or similar 
                taxes payable with respect to your access to and use of the NewHomePage LLC Platform.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3">3. Authorized Use of Licensed Materials</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">3.1 Authorized Users</h4>
              <p className="text-muted-foreground mb-4">
                An "Authorized User" is a natural person who is your employee and who has been identified and designated in writing 
                by you and accepted by NewHomePage. You shall be responsible for compliance with the terms of this Agreement by all 
                Authorized Users.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">3.2 Authorized Uses</h4>
              <p className="text-muted-foreground mb-4">
                Neither you nor Authorized Users shall access or use the NewHomePage LLC Platform for any purpose other than the 
                sales, marketing, or business development activities expressly permitted by this Section.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">3.3 Restrictions on Use</h4>
              <p className="text-muted-foreground mb-4">
                You shall not permit anyone who is not an Authorized User to access the Licensed Materials, redistribute or sell 
                any Licensed Materials, or reverse engineer any of the NewHomePage LLC Platform.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3">4. NewHomePage LLC Obligations</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">4.1 Support</h4>
              <p className="text-muted-foreground mb-4">
                NewHomePage LLC will provide reasonable assistance with activation and installation support. Our personnel are 
                available by email, online chat, phone, or fax between 7:00 a.m. and 4:00 p.m. Pacific Time.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">4.2 Security</h4>
              <p className="text-muted-foreground mb-4">
                NewHomePage LLC will maintain administrative, physical, and technical safeguards designed to protect the security, 
                confidentiality and integrity of your data.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3">5. Your Obligations</h3>
              
              <h4 className="text-lg font-medium mt-4 mb-2">5.1 Compliance with All Laws</h4>
              <p className="text-muted-foreground mb-4">
                You agree to abide by all local, state, national, and international laws and regulations applicable to your use 
                of the NewHomePage LLC Platform and Licensed Materials.
              </p>

              <h4 className="text-lg font-medium mt-4 mb-2">5.4 Do Not Call Compliance</h4>
              <p className="text-muted-foreground mb-4">
                You must comply with all rules, regulations, and laws including the TCPA, TSR, and national do-not-call registry. 
                You must obtain opt-in permission from your contacts where required.
              </p>

              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 mt-4">
                <h5 className="font-semibold mb-2">5.4.5 (A) Prohibitive Use</h5>
                <p className="text-sm mb-2">NewHomePage LLC prohibits any use of the Platform in connection with:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Unlawful, offensive, or harmful activities</li>
                  <li>Pornography or sexually explicit material</li>
                  <li>Illegal drugs or controlled substances</li>
                  <li>Fraudulent or misleading advertising</li>
                  <li>Spam or unsolicited commercial messages</li>
                  <li>Pyramid schemes or multilevel-marketing</li>
                  <li>Content that violates intellectual property rights</li>
                </ul>
              </div>
            </section>

            <section className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
              <div className="text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">NewHomePage LLC</p>
                <p>10053 Whittwood Dr #1201</p>
                <p>Whittier, CA 90603</p>
                <p>Phone: 877-399-1476</p>
                <p>Email: sales@NewHomePage.com</p>
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
