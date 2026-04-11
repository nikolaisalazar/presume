# Presume

A WYSIWYG resume editor that automatically resizes text to satisfy layout constraints — no manual font tweaking required.

Built on [Cheng Lou's Pretext](https://github.com/chenglou/pretext) for fast, DOM-reflow-free text measurement.

## How it works

Edit your resume directly on the page. As you type, Presume measures your text using Pretext and enforces two constraints automatically:

- **Single-line bullets** — each bullet point shrinks just enough to stay on one line
- **Page limit** — if the document overflows, all text scales down proportionally to fit

Both constraints are configurable. If content can't be made to fit without becoming illegible, the affected element is highlighted as a warning.

## Features

- Click-to-edit WYSIWYG interface — what you see is what you get, always
- Jake's Resume layout as the default template
- Configurable constraints: max pages, max lines per bullet, minimum font size
- Autosaves to localStorage
- Export as PDF or JSON
- Import from a previously exported JSON file

## Tech stack

- React 18 + TypeScript, built with Vite
- [`@chenglou/pretext`](https://github.com/chenglou/pretext) for text measurement
- `html2canvas` + `jsPDF` for client-side PDF export
- Deployed to GitHub Pages

## Development

```sh
npm install
npm run dev
```

## License

MIT
