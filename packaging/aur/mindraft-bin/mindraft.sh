#!/bin/sh
# WebKit2GTK + Mesa can fail with "surfaceless EGL display: EGL_BAD_ALLOC"
# on WSL, hybrid GPUs, and some Wayland setups. These defaults are overridable.
: "${WEBKIT_DISABLE_DMABUF_RENDERER:=1}"
: "${GSK_RENDERER:=cairo}"
export WEBKIT_DISABLE_DMABUF_RENDERER GSK_RENDERER

exec /opt/mindraft/mindraft "$@"
