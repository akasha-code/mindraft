<div align="center">

<img src="assets/logo.png" alt="MinDraft" width="128" height="128" />

# MinDraft

**A calm Markdown notepad** — open a `.md` file, read without clutter, edit only when you need to.

Works offline · light & dark theme · tabs · search · PDF export · English, Spanish & Norwegian

<br />

[![Download latest release](https://img.shields.io/github/v/release/akasha-code/mindraft?style=for-the-badge&label=Download)](https://github.com/akasha-code/mindraft/releases/latest)
[![License](https://img.shields.io/github/license/akasha-code/mindraft?style=for-the-badge)](LICENSE)

<br />

[**Windows**](#windows) · [**Linux**](#linux) · [**Arch Linux**](#arch-linux) · [**macOS**](#macos) · [**Features**](#features) · [**FAQ**](#faq)

</div>

---

## Get started in 30 seconds

1. **[Download MinDraft](https://github.com/akasha-code/mindraft/releases/latest)** for your system (links below).
2. **Install** and open the app.
3. **Open a `.md` file** — drag it in, use `Ctrl+O`, or double-click a Markdown file after install (desktop).

That’s it. No account, no cloud, no setup wizard.

---

## Download

All builds for **[v0.1.0 and newer](https://github.com/akasha-code/mindraft/releases/latest)** use **stable filenames** — these links always point to the latest release.

<!-- release-asset-names: MinDraft-[platform]-[arch][setup][ext] (arch is x64/amd64/aarch64 per platform) -->

### Windows

| | |
| --- | --- |
| **Installer (recommended)** | [**Download .exe**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-windows-x64-setup.exe) |
| **MSI package** | [**Download .msi**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-windows-x64.msi) |

Works on Windows 10/11 ([WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) is usually already installed).

SmartScreen may warn on first download (unsigned indie app) — choose **More info → Run anyway**.

### Linux

| | |
| --- | --- |
| **AppImage (portable, any distro)** | [**Download AppImage**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-amd64.AppImage) |
| **Debian / Ubuntu** | [**Download .deb**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-x86_64.deb) |
| **Fedora / RHEL** | [**Download .rpm**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-x86_64.rpm) |

```bash
chmod +x MinDraft-linux-amd64.AppImage
./MinDraft-linux-amd64.AppImage
```

### Arch Linux

No separate `.pkg.tar.zst` yet — use the **AppImage** (recommended) or build from source:

| | |
| --- | --- |
| **AppImage** | [**Download AppImage**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-amd64.AppImage) |

```bash
# Optional: install AppImage launcher
yay -S appimagelauncher   # or use chmod +x and run directly

curl -LO https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-linux-amd64.AppImage
chmod +x MinDraft-linux-amd64.AppImage
./MinDraft-linux-amd64.AppImage
```

Build from source: see [CONTRIBUTING.md](CONTRIBUTING.md).

### macOS

| | |
| --- | --- |
| **Apple Silicon (M1/M2/M3…)** | [**Download .dmg**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-darwin-aarch64.dmg) |
| **Intel Mac** | [**Download .dmg**](https://github.com/akasha-code/mindraft/releases/latest/download/MinDraft-darwin-x64.dmg) |

Open the `.dmg`, drag MinDraft to Applications, then open from Launchpad.

---

## Who is it for?

- **Notes & journals** in plain Markdown
- **READMEs and docs** you want to preview while writing
- **Technical writing** with headings, code blocks, Mermaid diagrams, and math
- **Quick edits** without living inside a heavy IDE

MinDraft is **preview-first**: you read comfortably, tap `i` or double-click to edit one block, save, and move on.

---

## Features

| You want to… | MinDraft lets you… |
| --- | --- |
| **Read** | See rendered Markdown with calm typography and themes (light / dark / system) |
| **Edit lightly** | Change one block in place — no full-screen editor unless you want it |
| **Work on several files** | Use tabs, restore your last session on desktop |
| **Find text** | Search with case match, regex, and replace |
| **Navigate long docs** | Jump to headings (`Ctrl+G`) |
| **Share or archive** | Copy, print, export HTML or PDF, reveal file in folder |
| **Use your language** | Switch UI: English, Español, Norsk (status bar) |

Also included: auto-save, Mermaid diagrams, KaTeX math, external change detection (desktop), keyboard shortcuts overlay (`?`).

---

## Essential shortcuts

| Action | Shortcut |
| --- | --- |
| Open file | `Ctrl+O` |
| Save | `Ctrl+S` |
| Search in document | `/` or `Ctrl+F` |
| Jump to heading | `Ctrl+G` |
| Next / previous tab | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| Move between blocks | `j` / `k` |
| Edit current block | `i` or double-click |
| Finish editing | `Esc` |
| All shortcuts | `?` |

Power users: command mode with `:w`, `:new`, `:h Title`, `:saveas`, and more — press `:` in the app.

---

## Windows + WSL

If you use **both** Windows and WSL, install MinDraft **twice**:

| Where | What to install |
| --- | --- |
| Windows desktop | [Windows build](#windows) |
| Inside WSL | [Linux .deb or AppImage](#linux) |

Keep your notes on a folder both can reach, for example:

```text
Windows:  C:\Users\you\Documents\notes\
WSL:      /mnt/c/Users/you/Documents/notes/
```

The **same `.md` files**; each app keeps its own theme and window layout.

---

## FAQ

**Is it free?**  
Yes. Apache 2.0 — use it at home or at work.

**Does it need the internet?**  
No. The desktop app works fully offline.

**Where are my files stored?**  
On your disk, wherever you save them. MinDraft does not upload your notes.

**Can I open `.md` files from the file manager?**  
Yes, on desktop installs (file association after install).

**Spanish UI?**  
Yes — globe icon in the status bar.

**Something broken or missing?**  
[Open an issue](https://github.com/akasha-code/mindraft/issues) on GitHub.

---

<div align="center">

Made by **[Guido Quadrini](https://www.linkedin.com/in/guidoquadrini)** · [Support the project ☕](https://www.buymeacoffee.com/matekraft)

<br />

Contributors & developers → [CONTRIBUTING.md](CONTRIBUTING.md)

</div>
