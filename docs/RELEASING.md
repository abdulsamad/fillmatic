# Releasing FillMatic

Releases are tag-driven. A pushed Git tag starts `.github/workflows/deploy.yml`, which tests the extension, builds the package, uploads the zip as a GitHub Actions artifact, and publishes it through the Chrome Web Store API.

## One-time repository configuration

Add these GitHub Actions secrets:

- `CHROME_WEB_STORE_CLIENT_ID`
- `CHROME_WEB_STORE_CLIENT_SECRET`
- `CHROME_WEB_STORE_REFRESH_TOKEN`
- `CHROME_WEB_STORE_PUBLISHER_ID`
- `CHROME_WEB_STORE_EXTENSION_ID`

The Google OAuth client and refresh token must belong to an account with access to the Chrome Web Store publisher.

## Release checklist

1. Pull the latest `main` and verify the worktree is clean.
2. Update the version in the root `package.json`. The manifest reads this value directly.
3. Move relevant entries in `CHANGELOG.md` into a section for that version and date.
4. Run the complete local checks:

   ```bash
   pnpm lint
   pnpm --filter extension test:coverage
   pnpm build
   ```

5. Load `apps/extension/build/` as an unpacked extension and smoke-test the popup, settings, mapper permission request, and demo page.
6. Commit the version and changelog changes.
7. Create and push an annotated version tag:

   ```bash
   git tag -a v0.1.2 -m "v0.1.2"
   git push origin main v0.1.2
   ```

8. Watch the **Build & Publish to Chrome Web Store** workflow. Download and inspect its zip artifact if publishing fails.
9. After Chrome Web Store processing completes, verify the listing version and run the public demo once with the installed store build.

## Packaging without publishing

```bash
pnpm build:extension
```

The extension build is written to `apps/extension/build/` and packaged as `deploy/fill-matic-v<version>.zip`.

## Hotfixes and rollback

The Chrome Web Store requires monotonically increasing versions, so a published version cannot be replaced by uploading an older version number. For a regression:

1. disable or contain the feature with an existing feature flag when possible;
2. revert the faulty change on a hotfix branch;
3. increment the patch version;
4. run the full release checklist; and
5. publish the new patch tag.

For an urgent security incident, follow `SECURITY.md` and consider temporarily disabling the listing while the hotfix is reviewed.
