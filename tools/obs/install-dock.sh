#!/usr/bin/env bash
# Copyright (c) 2026 Cristian D. Moreno — @Kyonax
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
#
# install-dock.sh — register the RECKIT control panel as an OBS
# Custom Browser Dock, the same mechanism Twitch uses for its
# in-OBS panels.
#
# OBS rewrites global.ini on shutdown, so it MUST NOT be running
# while this edits the file — the script refuses otherwise.
#
#   Usage: tools/obs/install-dock.sh [url] [title]
#   Default url:   http://localhost:5173/control
#   Default title: RECKIT Context

set -euo pipefail

URL="${1:-http://localhost:5173/control}"
TITLE="${2:-RECKIT Context}"
INI="$HOME/.config/obs-studio/global.ini"

if pgrep -x obs >/dev/null 2>&1; then
  echo "ERROR: OBS is running (pid $(pgrep -x obs | tr '\n' ' '))." >&2
  echo "       Quit OBS first — it overwrites global.ini on exit," >&2
  echo "       which would silently discard this change." >&2
  exit 1
fi

if [[ ! -f "$INI" ]]; then
  echo "ERROR: $INI not found. Launch OBS once, then quit it." >&2
  exit 1
fi

BACKUP="$INI.bak.$(date +%Y%m%d-%H%M%S)"
cp "$INI" "$BACKUP"
echo "backup -> $BACKUP"

URL="$URL" TITLE="$TITLE" INI="$INI" python3 <<'PY'
import json
import os
import re
import uuid

ini = os.environ["INI"]
url = os.environ["URL"]
title = os.environ["TITLE"]

with open(ini, "r", encoding="utf-8") as handle:
    lines = handle.read().splitlines()

key_re = re.compile(r"^ExtraBrowserDocks=(.*)$")

docks = []
key_index = None
for i, line in enumerate(lines):
    match = key_re.match(line)
    if match:
        key_index = i
        try:
            docks = json.loads(match.group(1))
        except ValueError:
            docks = []
        break

# Replace an existing entry with the same title, else append.
docks = [d for d in docks if d.get("title") != title]
docks.append({"title": title, "url": url, "uuid": uuid.uuid4().hex})
encoded = "ExtraBrowserDocks=" + json.dumps(docks, separators=(",", ":"))

if key_index is not None:
    lines[key_index] = encoded
    action = "updated existing ExtraBrowserDocks"
else:
    try:
        section = lines.index("[BasicWindow]")
        lines.insert(section + 1, encoded)
        action = "inserted into existing [BasicWindow]"
    except ValueError:
        if lines and lines[-1].strip():
            lines.append("")
        lines.append("[BasicWindow]")
        lines.append(encoded)
        action = "created [BasicWindow] section"

with open(ini, "w", encoding="utf-8") as handle:
    handle.write("\n".join(lines) + "\n")

print(f"{action}: {len(docks)} dock(s) registered")
for d in docks:
    print(f"   - {d['title']}  ->  {d['url']}")
PY

echo
echo "Done. Start OBS — the dock appears under View -> Docks."
