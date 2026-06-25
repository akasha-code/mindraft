# Windows portable (SFX)

`MinDraft-windows-x64-portable.exe` is a **self-extracting portable build**:

1. Double-click the same file every time (no installer, no admin).
2. Files extract to `%LOCALAPPDATA%\MinDraft\` (WebView2 runtime included).
3. MinDraft launches automatically.

## Build locally (Windows)

```powershell
cd path\to\mindraft
.\packaging\windows\build-portable.ps1
```

Output: `MinDraft-windows-x64-portable.exe` in the repo root.

## Update WebView2 pinned version

Edit `WEBVIEW2_FIXED_VERSION` / `WEBVIEW2_FIXED_CAB_URL` in `build-portable.ps1`, or set env vars before running the script. Download links come from [Microsoft WebView2 Fixed Version](https://developer.microsoft.com/microsoft-edge/webview2/#download-section).
