# FillMatic sample-file fixtures

These 12 files are small, synthetic fixtures used by the extension when it fills an HTML file input. They were created specifically for FillMatic and contain no personal data, real-world datasets, or third-party creative assets.

## Provenance

- Text, CSV, HTML, RTF-based DOC, OOXML DOCX, and PDF content is generated from project-owned source in `apps/extension/scripts/generate-sample-files.mjs`.
- PNG, JPEG, GIF, AAC, MP3, and MP4 content is generated from mathematical color, test-pattern, and sine-wave sources provided by FFmpeg filters. No external image, audio, or video input is used.
- Embedded document metadata identifies only FillMatic or the fixture generator. Fixed timestamps avoid leaking a contributor's local file history.

## Regeneration

Install FFmpeg, then run from the repository root:

```bash
pnpm --filter extension samples:generate
```

The generator requires Node.js, FFmpeg, and the standard `zip` command. It writes all 12 `sample.*` fixtures in this directory.

## License

These generated fixtures are included under the repository's [MIT License](../../../../LICENSE).
