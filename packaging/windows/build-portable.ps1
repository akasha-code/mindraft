# Builds MinDraft-windows-x64-portable.exe (7-Zip SFX with embedded WebView2 Fixed Runtime).
# Run from repo root on Windows (also used in GitHub Actions).

$ErrorActionPreference = "Stop"

$WebView2Version = if ($env:WEBVIEW2_FIXED_VERSION) { $env:WEBVIEW2_FIXED_VERSION } else { "131.0.2903.112" }
$WebView2CabUrl = if ($env:WEBVIEW2_FIXED_CAB_URL) {
  $env:WEBVIEW2_FIXED_CAB_URL
} else {
  "https://msedge.sf.dl.delivery.mp.microsoft.com/filestreamingservice/files/2A869E9E-9319-4644-B32C-73D121CABC49/Microsoft.WebView2.FixedVersionRuntime.$WebView2Version.x64.cab"
}

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
Set-Location $RepoRoot

$RuntimeDir = Join-Path $RepoRoot "src-tauri/WebView2FixedRuntime"
$CabPath = Join-Path $RepoRoot "src-tauri/WebView2FixedRuntime.cab"
$PortableConfig = Join-Path $RepoRoot "packaging/windows/tauri.portable.json"
$OutputExe = Join-Path $RepoRoot "MinDraft-windows-x64-portable.exe"
$StageDir = Join-Path $RepoRoot "packaging/windows/portable-stage"
$ArchivePath = Join-Path $RepoRoot "packaging/windows/portable.7z"
$SfxModule = "C:\Program Files\7-Zip\7zSD.sfx"
$SfxConfig = Join-Path $RepoRoot "packaging/windows/sfx-config.txt"
$SevenZip = "C:\Program Files\7-Zip\7z.exe"

function Require-Path($Path, $Label) {
  if (-not (Test-Path $Path)) {
    throw "$Label not found: $Path"
  }
}

Write-Host "Downloading WebView2 Fixed Runtime $WebView2Version..."
Invoke-WebRequest -Uri $WebView2CabUrl -OutFile $CabPath

if (Test-Path $RuntimeDir) {
  Remove-Item -Recurse -Force $RuntimeDir
}
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

Write-Host "Extracting WebView2 runtime..."
& expand.exe -F:* $CabPath $RuntimeDir | Out-Null

$WebView2Exe = Get-ChildItem -Path $RuntimeDir -Recurse -Filter "msedgewebview2.exe" | Select-Object -First 1
if (-not $WebView2Exe) {
  throw "msedgewebview2.exe not found after extracting WebView2 runtime."
}

# Tauri expects runtime files directly under WebView2FixedRuntime/.
$NestedRuntimeDir = $WebView2Exe.Directory.FullName
if ($NestedRuntimeDir -ne $RuntimeDir) {
  Get-ChildItem -Path $NestedRuntimeDir | ForEach-Object {
    Move-Item -Path $_.FullName -Destination $RuntimeDir -Force
  }
  Remove-Item -Recurse -Force $NestedRuntimeDir -ErrorAction SilentlyContinue
}

Write-Host "Building MinDraft with embedded WebView2..."
npm run tauri build -- --no-bundle --config $PortableConfig

$ReleaseDir = Join-Path $RepoRoot "src-tauri/target/release"
$BuiltExe = Get-ChildItem -Path $ReleaseDir -Filter "*.exe" |
  Where-Object { $_.Name -notmatch 'setup|installer' } |
  Select-Object -First 1

if (-not $BuiltExe) {
  throw "Release executable not found under $ReleaseDir"
}

if (Test-Path $StageDir) {
  Remove-Item -Recurse -Force $StageDir
}
New-Item -ItemType Directory -Force -Path $StageDir | Out-Null

Copy-Item $BuiltExe.FullName (Join-Path $StageDir "MinDraft.exe")
Copy-Item -Recurse $RuntimeDir (Join-Path $StageDir "WebView2FixedRuntime")

Require-Path $SevenZip "7-Zip"
Require-Path $SfxModule "7-Zip SFX module"
Require-Path $SfxConfig "SFX config"

if (Test-Path $ArchivePath) {
  Remove-Item -Force $ArchivePath
}

Write-Host "Creating 7z archive..."
& $SevenZip a -mx=9 $ArchivePath "$StageDir\*" | Out-Null

Write-Host "Creating self-extracting portable executable..."
$sfxBytes = [System.IO.File]::ReadAllBytes($SfxModule)
$configBytes = [System.IO.File]::ReadAllBytes($SfxConfig)
$archiveBytes = [System.IO.File]::ReadAllBytes($ArchivePath)

$stream = [System.IO.File]::Create($OutputExe)
try {
  $stream.Write($sfxBytes, 0, $sfxBytes.Length)
  $stream.Write($configBytes, 0, $configBytes.Length)
  $stream.Write($archiveBytes, 0, $archiveBytes.Length)
} finally {
  $stream.Close()
}

Write-Host "Portable build ready: $OutputExe"
