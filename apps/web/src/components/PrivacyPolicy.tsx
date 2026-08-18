import {
  CHROME_WEB_STORE_URL,
  LANDING_URL,
  PRIVACY_POLICY_LAST_UPDATED,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
} from "@fillmatic/config";
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
    { id: "extension-data", title: "Extension Data" },
    { id: "website-data", title: "Website Data" },
    { id: "permissions", title: "Extension Permissions" },
    { id: "sharing", title: "Sharing and Third Parties" },
    { id: "choices", title: "Your Choices" },
    { id: "changes", title: "Changes to This Policy" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Privacy Policy
          </CardTitle>
          <CardDescription>
            Last updated: {PRIVACY_POLICY_LAST_UPDATED}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            {PRODUCT_NAME} is built for local-first form testing. This policy
            explains what information the {PRODUCT_NAME} Chrome extension and
            website handle, why they handle it, and your available choices. The
            extension does not require an account.
          </p>

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
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="extension-data">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Extension Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">Processed locally</h3>
          <p className="mb-4">
            When you activate a fill, the extension locally inspects supported
            form controls and related metadata such as labels, names, IDs,
            placeholders, autocomplete attributes, and widget state. It then
            generates dummy values and writes them into the page. This
            processing is required for autofill and is not sent to a{" "}
            {PRODUCT_NAME} server.
          </p>

          <h3 className="text-xl font-semibold mb-2">
            Saved in Chrome storage
          </h3>
          <p className="mb-4">
            The extension stores settings and configuration in
            <code className="mx-1">chrome.storage.local</code> on your device.
            This can include profiles, field rules, Actions, recipes, mapping
            snapshots, typing preferences, ignored fields, and any reusable
            password or PIN you configure. These values can be sensitive, so do
            not configure secrets you do not want stored in your browser.
          </p>

          <h3 className="text-xl font-semibold mb-2">AI field mapping</h3>
          <p>
            If you use the optional field mapper, it scans serializable field
            metadata and may use Chrome&apos;s on-device Prompt API when
            available. The model is not required for normal autofill, and saved
            mappings remain local field rules that can be used without a model.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="website-data">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Website Data</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">Analytics</h3>
          <p className="mb-4">
            The {PRODUCT_NAME} website does not use Google Analytics or another
            analytics service.
          </p>

          <h3 className="text-xl font-semibold mb-2">
            Feedback and support requests
          </h3>
          <p className="mb-4">
            The feedback form on the {PRODUCT_NAME} website collects the name,
            email address, and message you choose to submit. The form sends that
            data to{" "}
            <a
              href="https://airform.io"
              className="text-blue-600 hover:underline"
            >
              Airform
            </a>
            , a third-party form-processing service that forwards the submission
            to our support inbox.
          </p>
          <p>
            Feedback is used to understand and respond to your request. It may
            be retained as reasonably necessary for support records. Do not
            submit passwords, payment details, private page contents, or other
            sensitive information. You can contact us directly at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-blue-600 hover:underline"
            >
              {SUPPORT_EMAIL}
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
          <p className="mb-4">
            {PRODUCT_NAME} requests these permissions for its user-triggered
            autofill features:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Website access on HTTP and HTTPS pages</strong>: The
              content script runs on ordinary websites so {PRODUCT_NAME} can
              inspect supported form fields and fill them when you request it.
              Browser-internal pages such as <code>chrome://</code> are not
              targeted.
            </li>
            <li>
              <strong>activeTab</strong>: Lets a user-initiated popup, keyboard
              shortcut, or side-panel action interact with the current tab.
            </li>
            <li>
              <strong>storage</strong>: Saves profiles, rules, Actions, recipes,
              mappings, preferences, and other configuration locally on your
              device.
            </li>
            <li>
              <strong>webNavigation</strong>: Identifies frames in the active
              tab so autofill can reach forms embedded in iframes. Actions only
              run in child frames when their iframe option is enabled.
            </li>
            <li>
              <strong>sidePanel (optional)</strong>: Requested only when you
              choose the optional field mapper. It provides a reviewable
              interface for scanning, editing, and applying field mappings.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">What we do not do</h3>
          <ul className="list-disc pl-6">
            <li>
              We do not collect or transmit general page contents, browsing
              history, or form submissions.
            </li>
            <li>
              We do not send page contents, generated values, profiles, recipes,
              or mappings to a {PRODUCT_NAME} server. Optional field mapping
              runs on-device when supported by Chrome.
            </li>
            <li>We do not sell extension data or share it with advertisers.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="sharing">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Sharing and Third Parties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The only website data disclosure described by this policy is the
            voluntary feedback form, which is processed by{" "}
            <a
              href="https://airform.io"
              className="text-blue-600 hover:underline"
            >
              Airform
            </a>{" "}
            before being forwarded to our support inbox. Review Airform&apos;s
            own policy before submitting feedback.
          </p>
          <p>
            The website is hosted at{" "}
            <a href={LANDING_URL} className="text-blue-600 hover:underline">
              {LANDING_URL}
            </a>
            . The extension is distributed through the{" "}
            <a
              href={CHROME_WEB_STORE_URL}
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Chrome Web Store
            </a>
            , whose own policies apply to that service.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto mb-8" id="choices">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Your Choices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6">
            <li>
              Use normal autofill without enabling the optional side panel.
            </li>
            <li>
              Remove saved extension data through the extension settings or
              Chrome&apos;s extension storage controls.
            </li>
            <li>
              Uninstall the extension to stop its content script from operating
              on webpages.
            </li>
            <li>
              Contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-blue-600 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              about a support submission or privacy question.
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
            If {PRODUCT_NAME} introduces a feature that changes data collection,
            storage, or sharing, this policy will be updated accordingly.
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
                Questions or concerns about this policy? Email{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-600 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </AlertDescription>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
