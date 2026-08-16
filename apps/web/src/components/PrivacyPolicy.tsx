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
import { SUPPORT_EMAIL } from "@fillmatic/config";
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
          <CardDescription>Last updated: August 16, 2026</CardDescription>
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
          <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
          <p className="mb-4">
            FillMatic does not use Google Analytics or another analytics service
            on its website or in the extension.
          </p>

          <h3 className="text-xl font-semibold mb-2">
            Feedback and Support Requests
          </h3>
          <p className="mb-4">
            The feedback form on the FillMatic website collects the name, email
            address, and message you choose to submit. The form sends that data
            to{" "}
            <a
              href="https://airform.io"
              className="text-blue-600 hover:underline"
            >
              Airform
            </a>
            , a third-party form-processing service, which processes the
            submission and forwards it to FillMatic's support inbox.
          </p>
          <p className="mb-4">
            Feedback and support correspondence is used only to understand and
            respond to your request. It may be retained for as long as
            reasonably necessary to handle the request and maintain support
            records. Do not submit passwords, payment details, private page
            contents, or other sensitive information.
          </p>
          <p>
            If you do not want to use Airform, you can contact FillMatic
            directly at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-blue-600 hover:underline"
            >
              hello+fillmatic[at]abdulsamad.dev
            </a>
            .
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
            <li>
              <strong>webNavigation</strong>: This permission lets FillMatic
              identify frames in the active tab so a user-initiated fill can
              reach eligible embedded forms.
            </li>
            <li>
              <strong>sidePanel (optional)</strong>: FillMatic requests this
              permission only when you choose to open the field mapper.
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
              The extension does not send page contents, generated values,
              profiles, recipes, or mappings to a FillMatic server. Its optional
              field-mapping model runs on-device when supported by Chrome.
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
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-600 hover:underline"
                >
                  hello+fillmatic[at]abdulsamad.dev
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
