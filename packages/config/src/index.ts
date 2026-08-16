/**
 * Shared product identity/constants for FillMatic — reused by the extension (apps/extension)
 * and the marketing site (apps/web) so name/description/URL changes happen in one place.
 */

/** Canonical product name, used across the extension UI and marketing site. */
export const PRODUCT_NAME = "FillMatic";

/**
 * Short description used for the Chrome extension manifest and package.json metadata.
 * Kept distinct from SEO_DESCRIPTION below — this one has to fit the Chrome Web Store's
 * shorter listing constraints, while SEO_DESCRIPTION is written for search-result snippets.
 */
export const PRODUCT_DESCRIPTION =
  "FillMatic autofills forms with dummy data in one click, saving developers time and making testing faster and easier.";

/** Longer description used for the marketing site's SEO meta tag. */
export const SEO_DESCRIPTION =
  "FillMatic instantly fills any web form with realistic fake data. The Chrome extension built for developers who test forms every day.";

/** Support/feedback contact address, used for mailto links and feedback form endpoints. */
export const SUPPORT_EMAIL = "hello+fillmatic@abdulsamad.dev";

/** Chrome Web Store listing URL. */
export const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/fillmatic/mpkjmebmnkhpfomlopbehcpmgmfndfje";

/** Marketing/landing site origin. */
export const LANDING_URL = "https://fillmatic.pages.dev";

/** Public demo page — opened on first install and used as the built-in demo Action's URL matcher. */
export const DEMO_URL = `${LANDING_URL}/demo`;

/** Local dev-server equivalent of DEMO_URL, used only when running the extension in dev mode. */
export const DEMO_URL_DEV = "http://localhost:3000/demo";
