## Changelog  
All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

### [v0.0.6] - 2024-11-04
#### Added
- **feat**: New landing page base with shadcn design components.

#### Changed
- **refactor**: Updated logo link for Chrome Webstore and revised privacy policy page.
- **refactor**: Enhanced initialization of popup and improved block-level scoping for switch cases.
- **refactor**: Turbo repo and Vite CRX plugin updated.

#### Fixed
- **fix:** Ignored readonly inputs to prevent autofill issues.
- **fix:** Resolved build failure impacting deployment.

---

### [v0.0.5] - 2024-10-20  
#### Added  
- **feat:** Sites rules logic and Stripe integration.  
- **feat:** Site rules core logic with Lemon Squeezy support.  

#### Fixed  
- **fix:** Lemon Squeezy button not appearing on the store.

#### Changed  
- **refactor:** Improved handling for radio buttons, checkboxes, and name fields.  
- **refactor:** Moved fill actions and message passing logic to the popup store.  
- **refactor:** Enhanced error handling and dependency updates.  

---

### [v0.0.4] - 2024-09-18  
#### Added  
- **feat:** New popup look with smooth scroll form into view.  
- **feat:** Hotkeys and tooltips for quick access.  

#### Changed  
- **refactor:** Updated turborepo configuration.  
- **refactor:** Improved scroll behavior across pages.  
- **refactor:** Open demo page automatically on start in the local environment.  
- **refactor:** Organized `Options` components into a dedicated directory.  

#### Fixed  
- **fix:** Build error resolved.  

#### Removed  
- **chore:** Deprecated code removed and warnings addressed.  

---

### [v0.0.3] - 2024-08-30  
#### Added  
- **feat:** Extension configurations added.  
- **feat:** New landing page with **shadcn** design components.  
- **feat:** Support for `autocomplete` attributes and mounted inputs.  

#### Changed  
- **refactor:** Updated extension links and internal page check utilities.  
- **refactor:** Improved password behavior with consistent values.  

---

## [Unreleased]  
#### Added  
- **feat:** Support for credit card fields, date of birth, and company input types.  
- **feat:** File input handling added.  

#### Changed  
- **refactor:** Migrated from lodash to es-toolkit for better performance.  
- **refactor:** Abstracted logic for element matching by name, ID, class, or label.  
- **refactor:** Removed side panels and unused logs for a cleaner experience.  

#### Fixed  
- **fix:** Mobile number deprecation warning handled.  
- **fix:** Disabled inputs are now filtered correctly.  

---

### [v0.0.2] - 2024-07-18  
#### Added  
- **feat:** Single form autofill and submit support.  
- **feat:** Integration with Lemon Squeezy and Stripe Checkout.  

---

### [v0.0.1] - 2024-06-30  
#### Added  
- **feat:** Basic autofill functionality for all inputs on a page.  
- **feat:** New logo and demo page integration.  

---