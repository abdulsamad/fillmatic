# Security policy

## Supported versions

Security fixes are made against the latest release of FillMatic. Users should update to the newest Chrome Web Store version before reporting an issue that may already be fixed.

## Reporting a vulnerability

Please do not open a public GitHub issue for a suspected vulnerability. Email [hello@abdulsamad.dev](mailto:hello@abdulsamad.dev) with:

- a clear description of the issue and its potential impact;
- the affected FillMatic version and Chrome version;
- reproducible steps or a minimal proof of concept; and
- any suggested remediation, if available.

The maintainer will acknowledge the report when it has been reviewed, coordinate validation and remediation privately, and credit the reporter unless anonymity is requested. This project does not currently operate a paid bug-bounty program.

## Security model

FillMatic is local-first. Form metadata, profiles, recipes, mappings, and generated values stay in the browser. The optional on-device field mapper uses Chrome's built-in Prompt API and does not send page data to a FillMatic server.

The extension intentionally uses a narrow permission set:

- `storage` persists local settings and mappings;
- `activeTab` lets an explicit user action operate on the current tab; and
- `sidePanel` is optional and requested only when the user opens the field mapper.

Content scripts run on HTTP and HTTPS pages because filling arbitrary development and testing forms is the product's core function. Closed shadow roots, browser-internal pages, and frames Chrome does not permit the extension to access remain outside its reach.

## Responsible testing

Test only pages and accounts you own or are authorized to assess. Do not include real credentials, personal information, private page contents, or active payment details in a report.
