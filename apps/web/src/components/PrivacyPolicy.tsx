import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fillmatic/ui";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

const PrivacyPolicy = () => {
  const sections = [
    { id: "information", title: "Information Collected and Received" },
    { id: "permissions", title: "Extension Permissions" },
    { id: "changes", title: "Changes to This Policy" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Privacy Policy
          </CardTitle>
          <CardDescription>Last updated: October 20, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            At FillMatic, we value and respect your privacy. We are committed to
            safeguarding your data and ensuring that our development decisions
            prioritize security and privacy protection. This privacy policy
            explains what information FillMatic collects, how it is used, and
            your options concerning the collection and use of this information.
          </p>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
            <ul className="list-disc pl-6">
              {sections.map((section) => (
                <li key={section.id} className="mb-2">
                  <a
                    href={`#${section.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="information">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Information Collected and Received
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">Google Analytics</h3>
          <p className="mb-4">
            To continuously improve FillMatic and its website, we use Google
            Analytics as described in{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-blue-600 hover:underline"
            >
              How Google uses data when you use our partners' sites or apps
            </a>
            &#46; Google Analytics helps us understand how the extension is used
            and where potential usability issues arise.
          </p>
          <p className="mb-4">
            The information collected through Google Analytics is anonymized and
            used solely for assessing usage trends. We do not collect personally
            identifiable information, nor do we share the anonymized data with
            third parties.
          </p>
          <p className="mb-4">
            You can prevent your data from being used by Google Analytics by
            installing the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              className="text-blue-600 hover:underline"
            >
              Google Analytics opt-out browser add-on
            </a>
            .
          </p>

          <h3 className="text-xl font-semibold mb-2">Support Requests</h3>
          <p className="mb-4">
            When you contact us with a support request, we may ask for
            information relevant to troubleshooting. This may include logs or
            other data you choose to provide. We can only access this data if
            you explicitly share it with us.
          </p>
          <p>
            While support correspondence may be archived, any data attached to
            it is deleted once the issue is resolved. At no point is this data
            shared with third parties or used beyond the scope of resolving your
            issue.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="permissions">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Extension Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">
            What FillMatic Is Allowed To Do
          </h3>
          <p className="mb-2">
            FillMatic requests the following permissions to perform its core
            functions:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Host permission (all URL access)</strong>: This permission
              is required to allow FillMatic to interact with the Document
              Object Model (DOM) of the web pages you visit, enabling it to read
              and fill form fields.
            </li>
            <li>
              <strong>activeTab</strong>: This permission allows FillMatic to
              access and modify the currently active tab to perform autofill
              operations when you interact with the extension.
            </li>
            <li>
              <strong>Storage</strong>: FillMatic uses the storage permission to
              save configurations, settings, and preferences locally on your
              device, ensuring that your custom settings persist between
              sessions.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">
            What FillMatic Is NOT Allowed To Do
          </h3>
          <ul className="list-disc pl-6">
            <li>
              FillMatic does not read the content of any web pages beyond the
              form fields necessary for its autofill functionality.
            </li>
            <li>
              FillMatic cannot send data to external servers or cloud services,
              and it does not store or transmit any data beyond the anonymized
              information used for Analytics.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="changes">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Changes to This Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            If FillMatic introduces new features that affect data collection,
            storage, or sharing, this privacy policy will be updated
            accordingly, and changes will be communicated to you through the
            extension or email, where applicable.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-10 px-5">
          <Alert className="p-3">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div className="ml-3">
              <AlertTitle>Contact Us</AlertTitle>
              <AlertDescription>
                If you have any questions or concerns about this privacy policy,
                please contact us at{" "}
                <a
                  href="mailto:hello@abdulsamad.dev"
                  className="text-blue-600 hover:underline"
                >
                  hello[at]abdulsamad.dev
                </a>
                &#46;
              </AlertDescription>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
