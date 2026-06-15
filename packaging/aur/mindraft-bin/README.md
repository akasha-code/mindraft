# AUR package: mindraft-bin

Packages the official **MinDraft** AppImage from [GitHub Releases](https://github.com/akasha-code/mindraft/releases).

## Install locally (test before publishing)

```bash
cd packaging/aur/mindraft-bin
makepkg -si
```

## Publish to AUR

1. Create an account on https://aur.archlinux.org if needed.
2. Add your SSH key in AUR account settings.
3. Clone the empty AUR package repo (first time only):

```bash
git clone ssh://aur@aur.archlinux.org/mindraft-bin.git
cd mindraft-bin
```

4. Copy these files into that directory:

- `PKGBUILD`
- `.SRCINFO`
- `mindraft.sh`
- `mindraft.desktop`
- `mindraft.png`

5. Commit and push:

```bash
makepkg --printsrcinfo > .SRCINFO
git add PKGBUILD .SRCINFO mindraft.sh mindraft.desktop mindraft.png
git commit -m "Initial release: MinDraft 0.1.0"
git push
```

## Update on new upstream release

1. Bump `pkgver` / `pkgrel` in `PKGBUILD`.
2. Update the AppImage `sha256sums` entry:

```bash
curl -LO "https://github.com/akasha-code/mindraft/releases/download/v${pkgver}/MinDraft-linux-amd64.AppImage"
sha256sum "MinDraft-linux-amd64.AppImage"
```

3. Regenerate `.SRCINFO`, commit, and push to AUR.

## After AUR publish

Users can install with:

```bash
yay -S mindraft-bin
# or
paru -S mindraft-bin
```
