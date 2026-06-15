# Contributing to MinDraft

Thanks for your interest. This document is for **developers and translators**. End users only need the [README](README.md) and [Releases](https://github.com/akasha-code/mindraft/releases).

## Development setup

```bash
git clone https://github.com/akasha-code/mindraft.git
cd mindraft
npm ci
npm run tauri dev
```

```bash
npm run check    # svelte-check + TypeScript
npm run test     # Vitest
```

Open a sample file on launch:

```bash
npm run tauri dev -- tests/fixtures/sample.md
```

### Arch Linux system dependencies

```bash
sudo pacman -S --needed base-devel curl wget file openssl pkgconf webkit2gtk-4.1 gtk3 libappindicator-gtk3 librsvg
```

### Ubuntu / Debian (CI deps)

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libappindicator3-dev librsvg2-dev patchelf
```

## Stack

- Tauri v2
- Svelte 5 + TypeScript
- CodeMirror 6
- unified / remark / rehype
- Vitest + GitHub Actions CI

## Translations

UI strings: `src/lib/i18n/locales/` (`en`, `es`, `no`). See [docs/I18N.md](docs/I18N.md).

## Web / PWA build

```bash
npm ci
npm run build
npm run preview   # http://localhost:4173
```

Browser mode supports drafts and image folders. Native dialogs, folder reveal, and external-editor integration require the desktop app.

## Publishing a release

Tag a version to build all desktop targets and upload assets with stable filenames (used in README download links):

```bash
git tag v0.1.0
git push origin v0.1.0
```

The [Release workflow](.github/workflows/release.yml) builds Windows, Linux, and macOS artifacts named `MinDraft-[platform]-[arch]…`.

Asset pattern is configured via `releaseAssetNamePattern` in `.github/workflows/release.yml`.

## App icon

Source artwork: `assets/logo.png` (1024×1024). Regenerate platform icons after updating it:

```bash
# From the master JPEG/PNG (trim + ~8px margin inside the square):
# magick SOURCE -fuzz 12% -trim +repage -resize 1008x1008 -background white -gravity center -extent 1024x1024 assets/logo.png
npx tauri icon assets/logo.png -o src-tauri/icons
magick assets/logo.png -resize 32x32 static/favicon.png
magick assets/logo.png -resize 192x192 static/icon-192.png
magick assets/logo.png -resize 512x512 static/icon-512.png
magick assets/logo.png -resize 180x180 static/apple-touch-icon.png
```

## CLI

```bash
mindraft README.md
npm run tauri dev -- tests/fixtures/sample.md
```

## Command reference (vim-style)

```text
:w          save
:saveas     save as
:new        new document
:e          open file
:h Title    jump to heading
:tabclose   close tab
:tabonly    close other tabs
:tabcloseall close all tabs
:bn / :bp   next / previous tab
:q / :wq / :q! / :x
```

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
