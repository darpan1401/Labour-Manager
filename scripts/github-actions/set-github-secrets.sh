#!/usr/bin/env bash

set -euo pipefail

REPO="${1:-darpan1401/Labour-Manager}"
KEYSTORE_BASE64_FILE="${2:-keystore-base64.txt}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is not installed."
  echo "Install it first, then run this script again."
  exit 1
fi

if [[ ! -f "$KEYSTORE_BASE64_FILE" ]]; then
  echo "Missing $KEYSTORE_BASE64_FILE"
  exit 1
fi

if [[ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  read -r -s -p "Android keystore password: " ANDROID_KEYSTORE_PASSWORD
  echo
fi

echo "Setting GitHub Actions secrets on $REPO..."

gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO" < "$KEYSTORE_BASE64_FILE"
printf "%s" "$ANDROID_KEYSTORE_PASSWORD" | gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$REPO" --body -

echo "Done. Secrets added:"
echo "- ANDROID_KEYSTORE_BASE64"
echo "- ANDROID_KEYSTORE_PASSWORD"
