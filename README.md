# Slate

Slate is a local-first progressive web application for composing, organizing, and maintaining personal notes. It is built with React, TypeScript, Vite, and a rich text editing surface, with note content stored directly in a user-selected folder on the local device.

The application is designed for private, offline-capable note taking without requiring a hosted database, account system, or cloud synchronization service.

## Features

- Rich text note editing powered by `@payablehq/richpad`.
- Local folder access through the File System Access API.
- Notes stored as `.html` files in the selected directory.
- Hierarchical folder and note explorer.
- Automatic saving with visible status feedback.
- Progressive web app support with offline-ready assets and automatic updates.
- Light and dark theme support.
- Keyboard shortcuts for common note operations.
- Print and export-oriented note handling.
- Toast notifications for user-facing operations and errors.

## Technology Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- IndexedDB through `idb`
- `@payablehq/richpad`
- `vite-plugin-pwa`

## Requirements

- Node.js 20 or later is recommended.
- npm, using the lockfile included in this repository.
- A modern browser with File System Access API support for full local folder integration.
- HTTPS when using deployed PWA functionality.

The File System Access API is currently best supported in Chromium-based browsers. Other browsers may load the application but can provide limited folder access behavior.

## Getting Started

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Usage

After opening the application, select a local folder to use as the notes workspace. Slate reads `.html` files from that folder and displays them in the explorer. New notes are created as `.html` files, and edits are written back to disk through the browser's file system permissions.

Because note data remains in the selected local folder, users are responsible for their own backup and synchronization strategy when working across multiple devices.

## Deployment

This repository is configured for GitHub Pages deployment through GitHub Actions. On every commit pushed to the `main` branch, the workflow installs dependencies, builds the Vite application, uploads the `dist` directory as a Pages artifact, and deploys it with GitHub's official Pages actions.

The deployed application URL is:

```text
https://jaideepghosh.github.io/slate/
```

The workflow also exposes the deployed page URL in the GitHub Actions environment entry and writes it to the workflow run summary.

If the repository is renamed or deployed from a custom domain, update the Vite `base` setting in `vite.config.ts` to match the final public path.

## Project Structure

```text
src/
	app/          Application shell and global styles
	components/   Editor, explorer, toolbar, layout, and shared UI
	hooks/        Autosave, file tree, and keyboard shortcut hooks
	services/     File system, storage, and export services
	store/        Zustand stores
	types/        Shared TypeScript types
```

## Contributing

Contributions are welcome. Please keep changes focused, preserve the local-first design of the application, and verify production builds before opening a pull request.

Recommended checks before submitting changes:

```bash
npm run build
```
