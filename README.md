# ScriptFlow CRM

A lightweight cold-calling CRM with visual call scripts, built for solo founders who prospect by phone.

**Live demo:** https://noyer8.github.io/SCRIPT-/#/crm

Runs entirely in the browser: no backend, no account. Data stays in your browser and can be synced across devices through a private GitHub Gist.

> UI is in French. Contributions for other languages are welcome.

## Features

- **Pipeline board** with drag & drop, configurable stages and colors
- **Daily call list** with automatic call-slot suggestions based on each prospect's opening hours, load-balanced across the day
- **Visual call scripts**: build branching scripts as a flowchart, then play them live during the call
- **Prospect pop-out** (Picture-in-Picture) that stays on top while you dial
- **CSV / TSV import** with column mapping and auto-detected separators
- **Custom fields**, tags, activity history and callback reminders
- **Cross-device sync** through a private GitHub Gist (token stays in your browser)
- **Optional integrations**: a booking link with prospect placeholders, and a webhook fired on import (n8n, Make, Zapier...)

## Getting started

```bash
git clone https://github.com/noyer8/SCRIPT-.git
cd SCRIPT-
npm install
npm run dev
```

Build for production with `npm run build`. The included GitHub Actions workflow deploys to GitHub Pages on every push to `main`.

## Configuration

Everything is configured in the app under **Settings**:

| Tab | What it does |
| --- | --- |
| Étapes du pipeline | Add, rename, reorder and color stages |
| Champs personnalisés | Add text, number, date, select, checkbox fields |
| Synchronisation | Paste a GitHub token with the `gist` scope to sync |
| Intégrations | Booking link template and import webhook |

Booking link placeholders: `{firstName}` `{lastName}` `{company}` `{email}` `{phone}`.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS, Zustand (persisted to localStorage), React Flow.

## Contributing

Issues and pull requests are welcome. Run `npm run build` before opening a PR.

## License

[MIT](LICENSE)
