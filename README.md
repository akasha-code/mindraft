<div align="center">

<img src="src-tauri/icons/icon.png" alt="MinDraft" width="96" height="96" />

# MinDraft

**A calm Markdown notepad** for opening, reading, quick-editing, and sharing `.md` files.

Preview-first · keyboard-driven · tabs · search · Mermaid & math · export to PDF

<br />

[![Release](https://img.shields.io/github/v/release/akasha-code/mindraft?style=for-the-badge&label=Download)](https://github.com/akasha-code/mindraft/releases/latest)
[![CI](https://img.shields.io/github/actions/workflow/status/akasha-code/mindraft/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/akasha-code/mindraft/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/akasha-code/mindraft?style=for-the-badge)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=000)](https://tauri.app)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=fff)](https://svelte.dev)

<br />

[**Download**](#download) · [**Features**](#features) · [**Shortcuts**](#shortcuts) · [**WSL**](#windows--wsl) · [**Develop**](#development)

</div>

---

## Download

Desktop builds are published on [**GitHub Releases**](https://github.com/akasha-code/mindraft/releases/latest). Pick your platform:

<!-- release-asset-names: MinDraft-[platform]-[arch][setup][ext] -->

### Windows

| | Link |
| --- | --- |
| **Installer (recommended)** | [**MinDraft-windows-x86_64-setup.exe**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-windows-x86_64-setup.exe) |
| **MSI package** | [**MinDraft-windows-x86_64.msi**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-windows-x86_64.msi) |

Requires [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (usually preinstalled on Windows 10/11).

Open a file from the terminal after install:

```powershell
mindraft README.md
```

### Linux

| | Link |
| --- | --- |
| **AppImage (portable)** | [**MinDraft-linux-x86_64.AppImage**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-x86_64.AppImage) |
| **Debian / Ubuntu (.deb)** | [**MinDraft-linux-x86_64.deb**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-x86_64.deb) |

```bash
chmod +x MinDraft-linux-x86_64.AppImage
./MinDraft-linux-x86_64.AppImage notes/today.md
```

Arch Linux (build from source): see [Development](#development).

### macOS

| Chip | Link |
| --- | --- |
| **Apple Silicon (M1/M2/M3…)** | [**MinDraft-darwin-aarch64.dmg**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-darwin-aarch64.dmg) |
| **Intel** | [**MinDraft-darwin-x86_64.dmg**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-darwin-x86_64.dmg) |

### Windows + WSL

Use **two separate installs** — one native app on Windows, one Linux build inside WSL. They share the same project files if you keep notes on the Windows drive:

| Where you work | Install |
| --- | --- |
| Windows desktop | [Windows installer](#windows) above |
| WSL terminal / Linux workflow | [Linux AppImage or .deb](#linux) inside your distro |

Example shared folder:

```text
Windows:  C:\Users\you\Documents\notes\
WSL:      /mnt/c/Users/you/Documents/notes/
```

Each environment keeps its own preferences (theme, locale, session). The markdown files are the same.

### Web (PWA)

MinDraft also ships as a static web build you can self-host or install as a PWA:

```bash
npm ci
npm run build
npm run preview   # local preview at http://localhost:4173
```

Browser mode supports drafts and image folders; native file dialogs, folder reveal, and external-editor integration require the desktop app.

---

## Features

| | |
| --- | --- |
| **Preview-first** | Read comfortably; press `i` or double-click a block to edit in place |
| **Multi-tab workspace** | Open many files, reorder tabs, restore your session on desktop |
| **Search & replace** | Case-sensitive, regex, in-document replace |
| **Headings** | Jump with `Ctrl+G`, `:h`, or `:heading` |
| **Rich Markdown** | GFM, Mermaid diagrams, KaTeX math |
| **Share menu** | Copy, print, export HTML/PDF, reveal in folder, open in external editor |
| **Auto-save** | Toggle autosave; manual save and Save As when you need control |
| **File watch** | Detect external changes to open files (desktop) |
| **Themes** | Light, dark, or follow the system |
| **Languages** | English (default), Spanish, Norwegian — switch from the status bar |

---

## Shortcuts

| Action | Keys |
| --- | --- |
| Open file | `Ctrl+O` · `:e` |
| Save | `Ctrl+S` · `:w` |
| Save as | double-click save icon · `:saveas` |
| New document | `:new` |
| Search | `/` · `Ctrl+F` |
| Headings | `Ctrl+G` · `:h Title` |
| Next / prev tab | `Ctrl+Tab` · `:bn` / `:bp` |
| Close tab | `Ctrl+W` · `:tabclose` |
| Block navigation | `j` / `k` |
| Edit block | `i` · double-click · `Esc` to confirm |
| Shortcuts overlay | `?` |

### Command mode

```text
:w · :saveas · :new · :e · :h Title · :tabclose · :tabonly · :tabcloseall
:bn · :bp · :q · :wq · :q! · :x
```

---

## Development

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

Open a fixture on launch:

```bash
npm run tauri dev -- tests/fixtures/sample.md
```

**Arch Linux** system deps:

```bash
sudo pacman -S --needed base-devel curl wget file openssl pkgconf webkit2gtk-4.1 gtk3 libappindicator-gtk3 librsvg
```

### Publish a release

Tag a version to build all desktop targets and upload assets with stable filenames:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The [Release workflow](.github/workflows/release.yml) produces the binaries linked above.

### Translations

UI strings live in `src/lib/i18n/locales/`. See [docs/I18N.md](docs/I18N.md).

---

## Stack

Tauri v2 · Svelte 5 · TypeScript · CodeMirror 6 · unified / remark / rehype · Vitest · GitHub Actions

---

<div align="center">

**[MinDraft](https://github.com/akasha-code/mindraft)** · Apache-2.0 · by [Guido Quadrini](https://www.linkedin.com/in/guidoquadrini)

</div>
