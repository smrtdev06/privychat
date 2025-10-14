import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Scale } from "lucide-react";

const LEGAL_ACCEPTANCE_KEY = "legal_terms_accepted";

// Privacy Policy Content
const PRIVACY_POLICY = `NewhomePage Privacy Policy

NewhomePage delivers analytics and other data-related services to small and medium-sized businesses, marketing companies, enterprises, and other organizations. The data is typically used by our customers for research, validation and verification services, marketing communications, targeting advertising, and similar uses.

Privacy Notice for California Residents
Privacy Notice for Colorado Residents
Privacy Notice for Connecticut Residents
Privacy Notice for Virginia Residents

Scope of this Privacy Policy

NewhomePage has created this privacy policy to demonstrate its commitment to privacy. This privacy policy applies to all visitors (individuals or businesses) to NewhomePage.com and all NewhomePage subsidiaries and describes how we use and share the personal information that we gather on our website. This policy does not apply to the practices of third parties that NewhomePage does not own or control, or to individuals and businesses that NewhomePage does not employ or manage. Further, our customers' use of our services and any data we provide to them is subject to the customers' privacy policies and practices, not this one.

NewhomePage does not knowingly collect personal information about children. If we discover we have collected personal information from an individual under 18, we will delete that information from our systems.

Opt-Out

NewhomePage appreciates and understands the importance of privacy. Any individual visitor (consumer or business) to NewhomePage can choose to Opt-Out, so information about them is not shared with NewhomePage customers. To "Opt-Out", please fill out the form on our Opt-Out page or send an email to sales@NewhomePage.com with your email address, full name, street address, date of birth and phone number.

Collection of Information on Our Website

Information We Collect Directly. NewhomePage collects personal information when visitors provide such information on our website, such as during registration, to request services, or through contact forms. We also may collect payment and authentication information depending on the services that you request from us.

Information We Collect Automatically. NewhomePage automatically receives and stores certain types of information whenever a visitor interacts with the NewhomePage website. For example, NewhomePage automatically receives and records certain "traffic data" on our server logs, including a visitor's IP address, the page requested, and interactions with the NewhomePage website. NewhomePage also automatically collects usage information, such as the number of and frequency of visitors to our site and their use of the NewhomePage service.

How We Use the Information We Collect

We use your information to provide our services and as described below.

Customer Service. To contact subscribers regarding their account status and changes to subscriber agreements, to respond to sales inquiries, and for other customer service-related purposes.

Marketing. To contact customers about special promotions, product release notices, and other information we think may be of interest to customers, including to send promotions via email.

Optimization and Personalization. To tailor the content and information that we may send or display, to offer location customization (where permitted by applicable law), personalized help and instructions, and to otherwise personalize your experiences while using our website or our services.

Improve and Analyze Services. To assess how customers use our services, to improve our services, to develop new products and services, and to provide statistical information to our partners about how customers use Versium.

Email Campaigns. To assess the success of marketing campaigns. For example, NewhomePage may receive a confirmation when an email sent by NewhomePage is opened. This enables us to make emails more relevant and interesting.

In addition, we may use aggregate and de-identified information for various other marketing, research and analysis purposes.

How We Share the Information We Collect

We may share your information as follows:

‍Marketing Partners. We do not share your information with companies that we believe might offer products and services of interest to you.

‍Our customers. We also may share information with those customers who hire us to perform analytics on their behalf. For information on how to opt-out, please see the opt-out section above.

‍Service Providers. We do not share the information we collect from you to third party vendors, service providers, contractors or agents who perform functions on our behalf.

We also may share your information in the following circumstances and with the following persons/entities:

‍Business Transfers. If we are acquired by or merge with another company, or if substantially all of our assets are transferred to another company (including as part of bankruptcy proceedings), we may transfer the information we have collected from you to the other company.

‍‍In Response to Legal Process. We may disclose the information we collect from you in order to comply with the law, judicial proceedings, a court order, subpoena or other legal process.

‍‍To Protect Us and Others. We may disclose the information we collect from you where we believe it is necessary to investigate, prevent or take action regarding illegal activities, suspected fraud, situations involving potential threats to the safety of any person, violations of our Terms of Use or this Policy, or as evidence in litigation in which we are involved.

Aggregate and De-Identified Information. We may share aggregate or de-identified information about users with third parties for marketing, advertising, research or similar purposes.

Third Party Links and Services

NewhomePage may permit third parties to offer subscription or registration-based services through the NewhomePage website and may provide links to third party websites. NewhomePage is not responsible for any actions or policies of such third parties. Visitors should check the applicable privacy policy of such party when providing personally identifiable information. Visitors should be aware that when they voluntarily disclose personal information to such third parties, that this information may result in unsolicited messages. Such activities are beyond the control of Versium.

Security

NewhomePage uses systems and procedures to safeguard its data. However, as no protection measure is 100% secure, we cannot guarantee against unauthorized or illegal access, disclosure, modification, or loss of data.

Cookies and Other Tracking Technologies

Visitors should be aware that we may collect information (for example, domain names or IP addresses) through our website using cookies and other technologies.

Cookies. Cookies are small unique strings of letters and numbers that are stored on your computer to make it easier for a website to recognize repeat visitors, facilitate a visitor's ongoing access to and use of our website, track usage behavior and compile aggregate data that will allow content improvements and targeted advertising. If a visitor does not want information collected through the use of cookies, most browsers allow the visitor to deny or block cookies. However, certain features and functionality on the NewhomePage website will not function if cookies are disabled.

LSOs. We may use Local Storage Objects ("LSOs"), to store your website preferences and to personalize your visit to our website. LSOs are different from browser cookies because of the amount and type of data stored. Typically, you cannot control, delete, or disable the acceptance of LSOs through your web browser.

Clear GIFs, tracking pixels and pixel tags, and other technologies. Clear GIFs are tiny graphics with a unique identifier, similar in functionality to cookies. In contrast to cookies, which are stored on your computer's hard drive, clear GIFs are embedded invisibly on web pages. We may use clear GIFs (a.k.a. web beacons, web bugs or pixel tags), in connection with our website to, among other things, track the activities of website visitors, help us manage content, and compile statistics about website usage. We and our third-party service providers also use clear GIFs in HTML emails to our customers, to help us track email response rates, identify when our emails are viewed, and track whether our emails are forwarded.

Third-Party Analytics. We use automated devices and applications, such as Google Analytics, along with other analytic means, to evaluate usage of our website and services. We use these tools to help us improve our website and services, including the performance and user experiences for each. These third-party devices and applications may use cookies and other tracking technologies to perform their services. Such third parties may combine the information that we provide about you with other information that they have collected. This privacy policy does not cover such third parties' use of data they collect or obtain.

Do-Not-Track. Currently, our website does not honor browser Do-Not-Track signals.

Third-Party Ad Network

We use third parties such as network advertisers to display advertisements about NewhomePage on third party websites, and to display third-party ads on our website. Network advertisers display advertisements on our sites and on other third-party sites, based on your visits to our website as well as other websites. This enables us and these third parties to target advertisements by displaying ads for products and services in which you might be interested.

Third party ad network providers, advertisers, sponsors and/or traffic measurement services may use cookies, JavaScript, web beacons (including clear GIFs), Flash LSOs and other technologies to measure the effectiveness of their ads, to personalize advertising content to you, and to track your movements on website and on other third-party sites. These third party cookies and other technologies are governed by each third party's specific privacy policy, and not this one. We may provide these third-party advertisers with de-identified information about your usage of our website and our services, as well as aggregate information about visitors to our website and users of our services; however, we do not share your personal information with these third parties.

You may opt-out of many third-party ad networks, including those operated by members of the Network Advertising Initiative ("NAI") and the Digital Advertising Alliance ("DAA"). For more information regarding this practice by NAI members and DAA members, and your choices regarding having this information used by these companies, including how to opt-out of third-party ad networks operated by NAI and DAA members, please visit their respective websites: http://www.networkadvertising.org/optout and http://www.aboutads.info/choices.

Your California Privacy Rights

Please refer to our Privacy Notice for California Residents.

Your Colorado Privacy Rights

Please refer to our Privacy Notice for Colorado Residents.

Your Connecticut Privacy Rights

Please refer to our Privacy Notice for Connecticut Residents.

Your Virginia Privacy Rights

Please refer to our Privacy Notice for Virginia Residents.

To Unsubscribe from Our Communications

You may unsubscribe from our marketing communications by clicking on the "unsubscribe" link located on the bottom of our e-mails, updating your communication preferences, or by sending us email us at sales@NewhomePage.com with Subject: Unsubscribe or postal mail to NewhomePage 10053 Whittwood Dr #1201 Whittier, CA 90603 Attention: Unsubscribe. Customers cannot opt out of receiving transactional emails related to their account with us or the Subscription Service.

Updates to the Privacy Policy

NewhomePage may make changes to this privacy statement from time to time. Notice will be provided on this page privacy-policy to any material changes made the policy. These policies outlined above are not intended to and do not create any contractual obligations or other legal rights in or on behalf of any other person or entity.

Contact Information

If you have any questions or comments about this Privacy Statement, the ways in which we obtain and use your personal information, your choices and rights regarding such use, please do not hesitate to contact us at:

Phone: 877-399-1476
Website: www.NewhomePage.com
Email: sales@NewhomePage.com

10053 Whittwood Dr #1201
Whittier, CA 90603
Toll free: 877-399-1476
FAX: 626 608 2082

Copyright © 2023 NewHomePage`;

// Terms & Conditions Content
const TERMS_CONDITIONS = `TERMS & CONDITIONS
NewHomePage LLC Hosted Services License Agreement

THIS LICENSE AGREEMENT ("AGREEMENT") IS A LEGAL AGREEMENT BETWEEN YOU ("YOU", "YOUR") AND NewHomePage ANALYTICS, A CALIFORNIA LLC CORPORATION WITH ITS PRINCIPAL OFFICE LOCATED AT 10053 Whittwood Dr #1201 Whittier, CA 90603 ("NewHomePage"). BY CHECKING THE BOX INDICATING ACCEPTANCE OF THIS AGREEMENT AND CLICKING THE BUTTON TO CONTINUE, ACCEPTING AN ORDERING DOCUMENT THAT INCORPORATES THIS AGREEMENT BY REFERENCE, OR BY OTHER MEANS PROVIDED BY NewHomePage LLC FOR ACCEPTANCE, YOU (A) ACKNOWLEDGE THAT YOU HAVE REVIEWED AND ACCEPT THIS AGREEMENT AND AGREE THAT YOU ARE LEGALLY BOUND BY ITS TERMS EFFECTIVE AS OF THE DATE OF ACCEPTANCE ("EFFECTIVE DATE"); AND (B) REPRESENT AND WARRANT THAT: (I) YOU ARE OF LEGAL AGE TO ENTER INTO A BINDING AGREEMENT; AND (II) IF YOU ARE ENTERING INTO THIS AGREEMENT ON BEHALF OF A CORPORATION, GOVERNMENTAL ORGANIZATION, OR OTHER LEGAL ENTITY, YOU HAVE THE RIGHT, POWER, AND AUTHORITY TO ENTER INTO THIS AGREEMENT ON BEHALF OF SUCH LEGAL ENTITY AND TO BIND SUCH LEGAL ENTITY TO THIS AGREEMENT AND, IN SUCH CASE, ANY REFERENCES TO "YOU" OR "YOUR" IN THIS AGREEMENT REFER TO SUCH ENTITY AND ALL OF ITS EMPLOYEES, CONTRACTORS, AGENTS AND REPRESENTATIVES. IF YOU DO NOT AGREE TO THE TERMS AND CONDITIONS OF THIS AGREEMENT, YOU MUST NOT ACCEPT OR SIGN THIS AGREEMENT AND MAY NOT USE THE LICENSED MATERIALS OR NewHomePage LLC PLATFORM.

IF YOU HAVE EXECUTED AN ORDERING DOCUMENT IN CONNECTION WITH THIS AGREEMENT, THE ORDERING DOCUMENT AND THE TERMS OF THIS AGREEMENT TOGETHER CONSTITUTE THE AGREEMENT OF THE PARTIES AND ARE REFERRED TO COLLECTIVELY HEREIN AS THE "AGREEMENT." IN THE EVENT OF ANY CONFLICT BETWEEN THESE TERMS AND AN ORDERING DOCUMENT, THESE TERMS SHALL GOVERN EXCEPT TO THE EXTENT A TERM IN AN APPLICABLE ORDERING DOCUMENT IS EXPRESSLY INTENDED TO MODIFY THESE TERMS.

NOTE: If you use a "beta" or other pre-release version of the NewHomePage Platform ("Beta Release"), you acknowledge and agree that the Beta Release may contain more, fewer or different features than a subsequent commercial release version of the NewHomePage LLC Platform. While NewHomePage generally intends to distribute commercial release versions of the NewHomePage LLC Platform, NewHomePage LLC reserves the right not to release later commercial release versions of any Beta Release. Without limiting any disclaimer of warranty or other limitation stated herein, you agree that any Beta Release is not considered by NewHomePage LLC to be suitable for commercial use, and that it may contain errors affecting its proper operation. BY ACCEPTING THIS AGREEMENT, YOU ACKNOWLEDGE AND AGREE THAT USE OF A BETA RELEASE MAY EXHIBIT SPORADIC DISRUPTIONS THAT HAVE THE POTENTIAL TO DISRUPT YOUR USE OF THE BETA RELEASE. YOU AGREE THAT NewHomePage v HAS NO LIABILITY OR RESPONSIBILITY FOR ANY DAMAGES THAT MAY RESULT FROM YOUR USE OF ANY BETA RELEASE.

1. Scope, Grant of License

1.1 Scope
This Agreement governs your access to and use of the NewHomePage LLC Platform (NewHomePage Paid Products, NewHomePage LLC or any other NewHomePage product or service) and Licensed Materials identified in your Ordering Document. For purposes of this Agreement "Licensed Materials" means the electronic information content and data made available by NewHomePage LLC to you via the NewHomePage LLC Platform, and "NewHomePage LLC Platform" means the NewHomePage LLC software-as-a-service identified in your applicable Ordering Document. The definition of NewHomePage LLC Platform does not include and specifically excludes Third Party Applications (defined below).

1.2 Access and Use License
Subject to your compliance with the terms and conditions of this Agreement, NewHomePage v hereby grants you and your Authorized Users (as defined below), during the Term of this Agreement, a non-exclusive license as more particularly described below in Section 3 to access and use the NewHomePage LLC Platform and to download and use the Licensed Materials.

1.3 API
If your applicable Ordering Document permits you to use NewHomePage's application programming interface to build applications that are compatible with the NewHomePage Platform (the "API"), then subject to your compliance with our API documentation and this Agreement, including, without limitation, your payment of all applicable fees, we hereby grant you an additional limited, revocable, non-transferable, non-exclusive, non-sublicensable license to access and use the API and its documentation for the sole purpose of interfacing the NewHomePage LLC Platform with your web-based applications (each a "Subscriber Application"), solely for your own internal business use, and not for timesharing, application service provider or service bureau use. You acknowledge and agree that your use of the API may be subject to volume and other restrictions imposed by NewHomePage LLC from time to time. We may monitor your use of the API to ensure quality, improve our products and services, and verify your compliance with this Agreement. Each Subscriber Application must maintain 100% compatibility with the NewHomePage LLC Platform. If any Subscriber Application implements an outdated version of the API, you acknowledge and agree that such Subscriber Application may not be able to communicate with the NewHomePage LLC Platform. You understand that we may cease support of old versions of the API.

1.4 Third Party Applications
"Third Party Applications" means computer software programs and other technology that are provided or made available to you or Authorized Users by third parties, including those with which the NewHomePage LLC Platform may interoperate, including, for example, your CRM software, marketing automation software, or sales enablement software, if any. NewHomePage LLC is not responsible for and does not endorse any Third Party Applications, services or websites linked to by the NewHomePage LLC Platform.

2. Fees & Taxes

2.1 Fees and Payment
You shall pay all fees stated in the Ordering Document (the "Subscription Fee"). All Subscription Fees are due upon execution of the Ordering Document and payable on the terms set forth therein. If no payment schedule is specified, the entire amount of the Subscription Fee shall be payable within 30 days of invoice. All amounts payable by You under this Agreement will be paid to NewHomePage LLC without setoff or counterclaim, and without any deduction or withholding.

2.2 Certain Remedies for Non-Payment
In the event that you fail to timely make any payment of Subscription Fees, NewHomePage LLC may, in its sole discretion, (i) restrict or suspend your and your Authorized Users' access to the NewHomePage LLC Platform and/or Licensed Materials until all past-due payments are made, (ii) terminate this Agreement, or (iii) accelerate the payment of Subscription Fees such that all unpaid Subscription Fees shall be immediately payable. NewHomePage LLC shall have the right to charge interest at the rate of 1.5% per month (or, if less, the highest rate permitted by law) on any late payments. Restriction or suspension of online access to the Licensed Materials during a period of non-payment shall have no effect on the Term of this Agreement nor on your obligation to pay the Subscription Fee.

2.3 Taxes
You are responsible for any applicable taxes, including, without limitation, any sales, use, levies, duties, or any value added or similar taxes payable with respect to your and your Authorized Users access to and use of the NewHomePage LLC Platform and/or Licensed Materials and assessable by any local, state, provincial, federal, or foreign jurisdiction.

For full terms and conditions, please contact us at sales@NewhomePage.com

Copyright © 2023 NewHomePage`;

// Privacy Policy Dialog Component
export function PrivacyPolicyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm" data-testid="link-privacy-policy">
          <FileText className="w-4 h-4 mr-1" />
          Privacy Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Please review our privacy policy
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-sm" data-testid="text-privacy-policy-content">
            {PRIVACY_POLICY}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Terms & Conditions Dialog Component
export function TermsConditionsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm" data-testid="link-terms-conditions">
          <Scale className="w-4 h-4 mr-1" />
          Terms & Conditions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please review our terms and conditions
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-sm" data-testid="text-terms-content">
            {TERMS_CONDITIONS}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Mobile Legal Links Modal Component with Auto-show
export function MobileLegalModal() {
  const [open, setOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile using matchMedia for more reliable detection
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const checkMobile = mediaQuery.matches;
    
    setIsMobile(checkMobile);

    if (!checkMobile) {
      // Not mobile, don't show anything
      return;
    }

    // Check if user has already accepted terms
    const accepted = localStorage.getItem(LEGAL_ACCEPTANCE_KEY);
    if (accepted === "true") {
      setHasAccepted(true);
    } else {
      // Auto-show modal on first visit (mobile only)
      setOpen(true);
    }

    // Listen for viewport changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches && open) {
        // Switched to desktop, close modal
        setOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [open]);

  const handleAccept = () => {
    try {
      localStorage.setItem(LEGAL_ACCEPTANCE_KEY, "true");
      // Verify it was set
      const verified = localStorage.getItem(LEGAL_ACCEPTANCE_KEY);
      if (verified === "true") {
        setHasAccepted(true);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to save legal acceptance:", error);
    }
  };

  // Don't render on desktop or if already accepted
  if (!isMobile || hasAccepted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-400 hover:text-slate-200"
          data-testid="button-legal-info"
        >
          Legal Information
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legal Information</DialogTitle>
          <DialogDescription>
            Please review and accept our terms to continue
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <PrivacyPolicyDialog />
          <TermsConditionsDialog />
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleAccept} 
            className="w-full"
            data-testid="button-accept-legal"
          >
            Accept Terms
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// PC Legal Links Component (always visible)
export function PCLegalLinks() {
  return (
    <div className="flex items-center gap-4 text-slate-400">
      <PrivacyPolicyDialog />
      <span className="text-slate-600">•</span>
      <TermsConditionsDialog />
    </div>
  );
}
