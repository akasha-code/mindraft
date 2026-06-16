#!/bin/sh
MINDRAFT_BIN="/opt/mindraft/mindraft"

if [ ! -x "$MINDRAFT_BIN" ]; then
  echo "MinDraft binary not found at $MINDRAFT_BIN" >&2
  exit 1
fi

if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
  echo "MinDraft needs a graphical session (DISPLAY or WAYLAND_DISPLAY is not set)." >&2
  exit 1
fi

# WebKit2GTK + Mesa: avoid EGL/ZINK crashes and blank "Connection refused" webviews
# on WSL, hybrid GPU, and broken Vulkan stacks (see issue #2).
: "${WEBKIT_DISABLE_DMABUF_RENDERER:=1}"
: "${WEBKIT_DISABLE_COMPOSITING_MODE:=1}"
: "${GSK_RENDERER:=cairo}"
export WEBKIT_DISABLE_DMABUF_RENDERER WEBKIT_DISABLE_COMPOSITING_MODE GSK_RENDERER

# Prefer CPU rendering unless the user opts into hardware GL.
# Fixes ZINK/Vulkan init failures that leave the webview on tauri://localhost unloaded.
if [ "$MINDRAFT_USE_HARDWARE_GL" != "1" ]; then
  : "${LIBGL_ALWAYS_SOFTWARE:=1}"
  : "${MESA_LOADER_DRIVER_OVERRIDE:=llvmpipe}"
  export LIBGL_ALWAYS_SOFTWARE MESA_LOADER_DRIVER_OVERRIDE
fi

# Some Wayland sessions fail with the default backend; allow forcing X11.
if [ "$MINDRAFT_USE_X11" = "1" ]; then
  export GDK_BACKEND=x11
fi

exec "$MINDRAFT_BIN" "$@"
