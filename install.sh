#!/usr/bin/env bash
set -euo pipefail

REPO="FoMonA/v3-"
BASE="https://github.com/${REPO}/releases/latest/download"

ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64)   BINARY="foma-setup-linux-x64" ;;
  aarch64|arm64)   BINARY="foma-setup-linux-arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

echo "Detected architecture: $ARCH → downloading $BINARY"
curl -fsSL "${BASE}/${BINARY}" -o /tmp/foma-setup
chmod +x /tmp/foma-setup
exec /tmp/foma-setup "$@"
