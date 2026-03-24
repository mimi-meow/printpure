# PrintPure Chrome Web Store Listing

## Name

PrintPure

## Summary

Extract the readable article from the current tab and open a clean, print-friendly preview.

## Category

Productivity

## Single Purpose

PrintPure has one purpose: turn the current webpage into a cleaner, more readable, print-friendly article preview.

## Description

PrintPure removes the clutter that usually makes webpages hard to print.

With one click, it reads the current tab, extracts the main article content, and opens a focused preview designed for reading and printing.

What PrintPure does:

- extracts the readable article from the current tab
- opens a clean preview in a dedicated tab
- lets you remove leftover blocks manually
- lets you undo removals or reset to the current extraction
- lets you re-extract from the source tab if the page changed
- supports printing directly from the preview

Why it is useful:

- cleaner printed pages
- fewer ads, sidebars, and navigation blocks
- easier reading before printing
- faster cleanup for long-form articles and blog posts

## Permissions Explanations

### activeTab

Used so PrintPure can read the page you explicitly choose when you click the extension.

### scripting

Used to inject the extraction script into the page you want to clean up.

### storage

Used to keep the current extracted article available while the preview is open.

### tabs

Used to keep track of the source tab and the preview tab during the extraction and preview flow.

### host_permissions: <all_urls>

Used so the extension can work on the sites you choose to run it on, instead of being limited to a fixed allowlist.

## Privacy Tab

Use these answers in the Chrome Web Store `Privacy` section.

### Single Purpose Description

PrintPure extracts the readable article from the current tab and opens a clean, print-friendly preview.

### Remote Code

Select:

- `No, I am not using remote code`

Justification:

- All executable logic is packaged inside the extension.
- The extension does not load or execute remotely hosted JavaScript or WebAssembly.
- The current code does not use `eval`, `new Function`, remote script tags, or fetched code execution.

### Data Usage Boxes

Check:

- `Web history`
- `Website content`

Leave the other data-type boxes unchecked.

Why:

- `Web history`: the extension reads the current page URL and keeps the source URL in session storage for the preview flow.
- `Website content`: the extension reads and processes the current page content to extract and display the article preview.

### Limited Use Certifications

Check all three:

- `I do not sell or transfer user data to third parties, outside of the approved use cases`
- `I do not use or transfer user data for purposes that are unrelated to my item's single purpose`
- `I do not use or transfer user data to determine creditworthiness or for lending purposes`

### Privacy Policy URL

Provide a public URL for the privacy policy page.

Use:

- `privacy-policy.html`

The public page should match:

- `PRIVACY.md`
