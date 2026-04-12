#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   STITCH_TOKEN=... ./scripts/fetch_stitch_project_assets.sh \
#     --api-base "https://<stitch-api-base>" \
#     --project-id "7266887951123028592" \
#     --out-dir "./stitch-mobile-pwa-upgrade"
#
# Notes:
# - Requires: curl, jq
# - The script fetches metadata for each screen, then downloads image/code artifact URLs if present.

API_BASE=""
PROJECT_ID="7266887951123028592"
OUT_DIR="./stitch-mobile-pwa-upgrade"
TOKEN="${STITCH_TOKEN:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-base)
      API_BASE="${2:-}"
      shift 2
      ;;
    --project-id)
      PROJECT_ID="${2:-}"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="${2:-}"
      shift 2
      ;;
    --token)
      TOKEN="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$API_BASE" ]]; then
  echo "Missing --api-base (example: https://api.stitch.example/v1)" >&2
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  echo "Missing Stitch token. Set STITCH_TOKEN env var or pass --token." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# name|screen_id
SCREENS=(
  "design-system|asset-stub-assets-fa55a3535b684993876d280eb6106c8a-1776001023060"
  "exam-leaderboard-pwa|004fc199032d426096b4c56e89b0cb50"
  "teacher-results-overview-pwa|071ed8625fa94a31af4c5b4c1867557d"
  "submission-detail-modal-pwa|1e41b43c09514530813cc486b8f23cf2"
  "feedback-states-skeletons|6c918149bf614a49a7d4a6ced0e3b4dc"
  "submission-detail-modal|7818b530be54453985c00603808efc4d"
  "teacher-results-overview|acebe95971184ba8b49a07a832db47be"
  "exam-leaderboard-analytics|e6af0560ee444916a216fbcaea628442"
  "feedback-states-pwa|f2259108a70048f8af80a92610ad14aa"
)

echo "Fetching project $PROJECT_ID into $OUT_DIR"

for item in "${SCREENS[@]}"; do
  name="${item%%|*}"
  screen_id="${item##*|}"
  meta_file="$OUT_DIR/${name}.json"

  echo "→ $name ($screen_id)"

  curl -sSL "${API_BASE}/projects/${PROJECT_ID}/screens/${screen_id}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/json" \
    -o "$meta_file"

  # Try common response keys for stitched assets.
  image_url="$(jq -r '
    .imageUrl //
    .hostedImageUrl //
    .artifacts.image.url //
    .artifacts.images[0].url //
    empty
  ' "$meta_file")"
  code_url="$(jq -r '
    .codeUrl //
    .hostedCodeUrl //
    .artifacts.code.url //
    .artifacts.files[]?.url //
    empty
  ' "$meta_file" | head -n 1)"

  if [[ -n "$image_url" ]]; then
    curl -sSL "$image_url" -o "$OUT_DIR/${name}.png"
    echo "  image: $OUT_DIR/${name}.png"
  else
    echo "  image: not found in metadata"
  fi

  if [[ -n "$code_url" ]]; then
    curl -sSL "$code_url" -o "$OUT_DIR/${name}.tsx"
    echo "  code:  $OUT_DIR/${name}.tsx"
  else
    echo "  code:  not found in metadata"
  fi
done

echo "Done."
