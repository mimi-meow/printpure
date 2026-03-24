# PrintPure

PrintPure is a Chrome extension that extracts the readable article from the current tab, opens a clean preview, lets you remove leftover blocks manually, and prints the result.

This repo now contains only the runtime extension files needed to load the extension in Chrome. There is no web app, no build toolchain, and no Node dependency.


## Chrome Web Store Prep

Before you publish, check these items carefully:

1. Confirm the manifest metadata is correct:
   - `name` is the final public extension name.
   - `description` is concise and accurate.
   - `version` is higher than the last uploaded version.
   - `manifest.json` stays in the ZIP root, not inside a subfolder.
2. Add extension icons to the repo and register them in `manifest.json`.
   - Chrome’s extension docs say you should provide square PNG icons.
   - Recommended manifest sizes are `16x16`, `32x32`, `48x48`, and `128x128`.
   - The `128x128` icon is the one used for installation and the Chrome Web Store.
   - SVG is not supported for manifest icons.
   - This repo now includes `icon16.png`, `icon32.png`, `icon48.png`, and `icon128.png`, and `manifest.json` is wired to use them.
3. Test the unpacked extension in Chrome on real pages:
   - a normal article page
   - a page with lots of images
   - a page that should fail cleanly, such as `chrome://extensions`
   - the full preview flow: extract, remove blocks, undo, reset, re-extract, print
4. Review permissions before submission.
   - Be ready to explain why the extension needs `activeTab`, `scripting`, `storage`, `tabs`, and `host_permissions`.
   - If Chrome Web Store review asks what the extension does, the answer is that it reads the current page, extracts article content, opens a clean preview, and lets the user print it.
5. Prepare the required listing assets for the dashboard:
   - at least 1 screenshot of the real extension UI
   - 1 small promotional image at `440x280`
   - the extension icon used in the package
   - optional but useful: support URL, website URL, privacy policy URL if applicable
   - This repo now includes `promo-440x280.png`, `promo-1400x560.png`, and `screenshot-1280x800.png` for listing assets.

## Icon Requirements

For the extension package itself:

- Put PNG icon files in the repo, for example `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`.
- Add them to `manifest.json` under `"icons"`.
- Keep them square and visually simple.
- Make sure they still read well on both light and dark backgrounds.

For the Chrome Web Store listing:

- Include a `128x128` extension icon in the uploaded ZIP.
- Use `screenshot-1280x800.png` for the required screenshot.
- Use `promo-440x280.png` for the required small promo image at `440x280`.
- Optionally use `promo-1400x560.png` as the marquee image.
- Screenshots should show the real product, not mockups that misrepresent the extension.

## Make A Release Zip

1. Update the version in `manifest.json`
2. Make sure the icon files you added are included in the root package
3. Zip the extension files from the repo root. At minimum that means:
   - `manifest.json`
   - `background.js`
   - `preview.html`
   - `preview.css`
   - `preview.js`
   - `contentScript.js`
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`
   - Do not include `promo-440x280.png`, `promo-1400x560.png`, or `screenshot-1280x800.png` in the extension ZIP; those are for the store listing, not the runtime package.

   ```bash

   zip -r printpure_chrome_extension.zip manifest.json background.js preview.html preview.css preview.js contentScript.js icon16.png icon32.png icon48.png icon128.png
   
   ```

4. Upload `printpure_chrome_extension.zip` in the Chrome Web Store dashboard
5. Complete the store listing fields, screenshots, promo image, and policy information
6. Submit for review
