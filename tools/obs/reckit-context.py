# Copyright (c) 2026 Cristian D. Moreno — @Kyonax
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

#   __  __         __         _      __
#  / /_/ /  ___   / /  ____  (_)__  / /_
# / __/ _ \/ -_) / _ \/ __/ / / _ \/ __/
# \__/_//_/\__/ /_.__/_/   /_/_//_/\__/
#
# reckit-context.py — OBS front-end script (the joint)
# 2026-08-31
#
# Drives the RECKIT context-screen web source from inside OBS. Two
# modes, both live:
#
#   FILE MODE  — pick one of the .org files discovered on disk.
#   LIVE TEXT  — type the title / description / talking points / body
#                directly in this panel. The text is assembled into a
#                valid .org document, pushed over the relay and parsed
#                in the browser source at runtime, so the full .org
#                feature set (headings, lists, checkboxes, tables,
#                code blocks, GitHub-style alerts) is available to
#                text typed here. Live text OVERRIDES file mode while
#                "Use live text" is ticked.
#
# Talks to the Vite dev-server relay documented in session file §1.16:
# GET/POST JSON at <base>/__context_state, shape
# { "active_slug": str|null, "sidebar_open": bool, "draft_org": str }.
#
#   Tools -> Scripts -> + -> select this file
#
# Guidelines:
#   Never block the UI thread — every request is timeout-bounded
#   Contexts are discovered from disk, not hardcoded
#   Relay base URL is configurable (dev server port may drift)
#
# Cristian D. Moreno (Kyonax)
# kyonax.corp@gmail.com

import json
import os
import urllib.error
import urllib.request

import obspython as obs

RELAY_PATH = "/__context_state"
REQUEST_TIMEOUT_S = 1.5

DEFAULT_BASE_URL = "http://localhost:5173"
DEFAULT_CONTEXTS_DIR = (
    "/run/media/kyonax/Da_ Disk/dev/github-kyonax/kyo-recording-automation/@kyonax_on_tech/data/contexts"
)

base_url = DEFAULT_BASE_URL
contexts_dir = DEFAULT_CONTEXTS_DIR
active_slug = ""
sidebar_open = False

# Live-text draft fields.
use_live_text = False
draft_title = ""
draft_subtitle = ""
draft_description = ""
draft_tags = ""
draft_marquee = ""
draft_body = ""
save_slug = "live-note"

# slug -> display title, rebuilt by refresh_contexts()
context_titles = {}
context_slugs = []

hotkey_ids = {}
HOTKEYS = {
    "reckit_toggle_sidebar": "RECKIT: toggle context sidebar",
    "reckit_next_context": "RECKIT: next context",
    "reckit_prev_context": "RECKIT: previous context",
    "reckit_clear_context": "RECKIT: clear context",
}


# ------------------------------------------------------------ draft build

def build_draft_org():
    """Assemble the panel fields into a valid .org document.

    Returns "" when live text is off or has no title — the overlay
    treats an empty draft as "fall back to the selected file".
    `#+TITLE:` and `#+DESCRIPTION:` are required by the parser's schema
    lock, so a description is always emitted even when blank.
    """
    if not use_live_text:
        return ""
    if not draft_title.strip():
        return ""

    lines = [f"#+TITLE: {draft_title.strip()}"]
    if draft_subtitle.strip():
        lines.append(f"#+SUBTITLE: {draft_subtitle.strip()}")
    lines.append(f"#+DESCRIPTION: {draft_description.strip()}")

    tags = [t.strip() for t in draft_tags.replace(",", ":").split(":")]
    tags = [t for t in tags if t]
    if tags:
        lines.append("#+TAGS: :" + ":".join(tags) + ":")

    marquee = [m.strip() for m in draft_marquee.splitlines()]
    marquee = [m for m in marquee if m]
    if marquee:
        lines.append("")
        lines.append("#+begin_marquee")
        lines.extend(marquee)
        lines.append("#+end_marquee")

    if draft_body.strip():
        lines.append("")
        lines.append(draft_body.rstrip())

    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- relay

def relay_url():
    return base_url.rstrip("/") + RELAY_PATH


def relay_get():
    """Return current relay state, or None when unreachable."""
    try:
        req = urllib.request.Request(relay_url(), method="GET")
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as res:
            return json.loads(res.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError) as err:
        obs.script_log(obs.LOG_WARNING, f"[reckit] relay GET failed: {err}")
        return None


def push():
    """Push a full state snapshot. Returns True on success."""
    draft = build_draft_org()
    payload = json.dumps({
        "active_slug": active_slug if active_slug else None,
        "sidebar_open": bool(sidebar_open),
        "draft_org": draft,
    }).encode("utf-8")
    try:
        req = urllib.request.Request(
            relay_url(),
            data=payload,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S):
            pass
        mode = f"live({len(draft)}b)" if draft else (active_slug or "(none)")
        obs.script_log(
            obs.LOG_INFO,
            f"[reckit] pushed {mode} sidebar={sidebar_open}",
        )
        return True
    except (urllib.error.URLError, OSError) as err:
        obs.script_log(obs.LOG_WARNING, f"[reckit] relay POST failed: {err}")
        return False


# ------------------------------------------------------------- discovery

def read_title(path):
    """Pull #+TITLE: from an .org file; fall back to the filename."""
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for _ in range(40):
                line = handle.readline()
                if not line:
                    break
                stripped = line.strip()
                if stripped.upper().startswith("#+TITLE:"):
                    return stripped.split(":", 1)[1].strip()
    except OSError:
        pass
    return os.path.splitext(os.path.basename(path))[0]


def refresh_contexts():
    """Rescan the contexts directory for .org files."""
    global context_titles, context_slugs
    context_titles = {}
    context_slugs = []
    if not os.path.isdir(contexts_dir):
        obs.script_log(
            obs.LOG_WARNING,
            f"[reckit] contexts dir not found: {contexts_dir}",
        )
        return
    for name in sorted(os.listdir(contexts_dir)):
        if not name.endswith(".org"):
            continue
        slug = name[: -len(".org")]
        context_slugs.append(slug)
        context_titles[slug] = read_title(os.path.join(contexts_dir, name))
    obs.script_log(
        obs.LOG_INFO,
        f"[reckit] discovered {len(context_slugs)} context(s)",
    )


def step_context(delta):
    """Move the selection through the discovered list, wrapping."""
    global active_slug
    if not context_slugs:
        refresh_contexts()
    if not context_slugs:
        return
    if active_slug in context_slugs:
        index = (context_slugs.index(active_slug) + delta) % len(context_slugs)
    else:
        index = 0 if delta > 0 else len(context_slugs) - 1
    active_slug = context_slugs[index]
    push()


# --------------------------------------------------------------- hotkeys

def on_toggle_sidebar(pressed):
    global sidebar_open
    if not pressed:
        return
    sidebar_open = not sidebar_open
    push()


def on_next_context(pressed):
    if pressed:
        step_context(1)


def on_prev_context(pressed):
    if pressed:
        step_context(-1)


def on_clear_context(pressed):
    global active_slug
    if not pressed:
        return
    active_slug = ""
    push()


HOTKEY_CALLBACKS = {
    "reckit_toggle_sidebar": on_toggle_sidebar,
    "reckit_next_context": on_next_context,
    "reckit_prev_context": on_prev_context,
    "reckit_clear_context": on_clear_context,
}


# ------------------------------------------------------------- ui buttons

def button_apply(props, prop):
    push()
    return True


def button_refresh(props, prop):
    refresh_contexts()
    return True


def button_open(props, prop):
    global sidebar_open
    sidebar_open = True
    push()
    return True


def button_close(props, prop):
    global sidebar_open
    sidebar_open = False
    push()
    return True


def button_clear(props, prop):
    global active_slug
    active_slug = ""
    push()
    return True


def button_pull(props, prop):
    """Adopt whatever the relay currently holds (landing page wins)."""
    global active_slug, sidebar_open
    state = relay_get()
    if state is None:
        return True
    active_slug = state.get("active_slug") or ""
    sidebar_open = bool(state.get("sidebar_open"))
    obs.script_log(
        obs.LOG_INFO,
        f"[reckit] pulled slug={active_slug or '(none)'} "
        f"sidebar={sidebar_open}",
    )
    return True


def button_save_draft(props, prop):
    """Persist the live draft to <contexts_dir>/<save_slug>.org."""
    draft = build_draft_org()
    if not draft:
        obs.script_log(
            obs.LOG_WARNING,
            "[reckit] nothing to save — tick 'Use live text' and set a title",
        )
        return True
    slug = save_slug.strip() or "live-note"
    slug = "".join(c for c in slug if c.isalnum() or c in "-_").lower()
    if not os.path.isdir(contexts_dir):
        obs.script_log(
            obs.LOG_WARNING, f"[reckit] contexts dir missing: {contexts_dir}")
        return True
    path = os.path.join(contexts_dir, f"{slug}.org")
    try:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(draft)
        obs.script_log(obs.LOG_INFO, f"[reckit] saved {path}")
    except OSError as err:
        obs.script_log(obs.LOG_WARNING, f"[reckit] save failed: {err}")
        return True
    refresh_contexts()
    return True


# --------------------------------------------------------- obs lifecycle

def script_description():
    return (
        "<b>RECKIT — Context Screen control</b><hr>"
        "Drive the <code>context-screen</code> browser source without "
        "leaving OBS.<br><br>"
        "<b>File mode</b> — pick a discovered <code>.org</code> file.<br>"
        "<b>Live text</b> — tick <i>Use live text</i> and just type. "
        "The overlay updates as you write; the Body field accepts full "
        "org markup (headings, <code>- lists</code>, "
        "<code>- [ ] checkboxes</code>, tables, "
        "<code>#+begin_src</code> blocks).<br><br>"
        "Requires the RECKIT dev server — set the base URL to match "
        "its port. Bind the four <b>RECKIT:</b> actions in "
        "<i>Settings → Hotkeys</i>."
    )


def script_defaults(settings):
    obs.obs_data_set_default_string(settings, "base_url", DEFAULT_BASE_URL)
    obs.obs_data_set_default_string(
        settings, "contexts_dir", DEFAULT_CONTEXTS_DIR)
    obs.obs_data_set_default_bool(settings, "sidebar_open", False)
    obs.obs_data_set_default_bool(settings, "use_live_text", False)
    obs.obs_data_set_default_string(settings, "save_slug", "live-note")


def script_properties():
    props = obs.obs_properties_create()

    obs.obs_properties_add_text(
        props, "base_url", "Relay base URL", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_path(
        props, "contexts_dir", "Contexts folder",
        obs.OBS_PATH_DIRECTORY, "", contexts_dir)

    picker = obs.obs_properties_add_list(
        props, "context_slug", "Active context (file)",
        obs.OBS_COMBO_TYPE_LIST, obs.OBS_COMBO_FORMAT_STRING)
    obs.obs_property_list_add_string(picker, "— none —", "")
    for slug in context_slugs:
        label = f"{context_titles.get(slug, slug)}  ({slug})"
        obs.obs_property_list_add_string(picker, label, slug)

    obs.obs_properties_add_bool(props, "sidebar_open", "Sidebar open")

    # ---- live text -----------------------------------------------------
    obs.obs_properties_add_bool(
        props, "use_live_text", "Use live text (overrides file)")
    obs.obs_properties_add_text(
        props, "draft_title", "Title", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_text(
        props, "draft_subtitle", "Subtitle", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_text(
        props, "draft_description", "Description", obs.OBS_TEXT_MULTILINE)
    obs.obs_properties_add_text(
        props, "draft_tags", "Tags (comma separated)", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_text(
        props, "draft_marquee", "Talking points (one per line)",
        obs.OBS_TEXT_MULTILINE)
    obs.obs_properties_add_text(
        props, "draft_body", "Body (org markup)", obs.OBS_TEXT_MULTILINE)

    obs.obs_properties_add_button(
        props, "btn_apply", "Apply now", button_apply)
    obs.obs_properties_add_button(
        props, "btn_open", "Sidebar: OPEN", button_open)
    obs.obs_properties_add_button(
        props, "btn_close", "Sidebar: CLOSE", button_close)

    obs.obs_properties_add_text(
        props, "save_slug", "Save as slug", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_button(
        props, "btn_save", "Save live text as .org file", button_save_draft)

    obs.obs_properties_add_button(
        props, "btn_refresh", "Rescan contexts folder", button_refresh)
    obs.obs_properties_add_button(
        props, "btn_clear", "Clear file context", button_clear)
    obs.obs_properties_add_button(
        props, "btn_pull", "Pull state from relay", button_pull)

    return props


def script_update(settings):
    global base_url, contexts_dir, active_slug, sidebar_open
    global use_live_text, draft_title, draft_subtitle, draft_description
    global draft_tags, draft_marquee, draft_body, save_slug

    new_dir = obs.obs_data_get_string(settings, "contexts_dir")
    base_url = obs.obs_data_get_string(settings, "base_url")
    save_slug = obs.obs_data_get_string(settings, "save_slug")

    before = (
        active_slug, sidebar_open, use_live_text, draft_title,
        draft_subtitle, draft_description, draft_tags, draft_marquee,
        draft_body,
    )

    active_slug = obs.obs_data_get_string(settings, "context_slug")
    sidebar_open = obs.obs_data_get_bool(settings, "sidebar_open")
    use_live_text = obs.obs_data_get_bool(settings, "use_live_text")
    draft_title = obs.obs_data_get_string(settings, "draft_title")
    draft_subtitle = obs.obs_data_get_string(settings, "draft_subtitle")
    draft_description = obs.obs_data_get_string(settings, "draft_description")
    draft_tags = obs.obs_data_get_string(settings, "draft_tags")
    draft_marquee = obs.obs_data_get_string(settings, "draft_marquee")
    draft_body = obs.obs_data_get_string(settings, "draft_body")

    after = (
        active_slug, sidebar_open, use_live_text, draft_title,
        draft_subtitle, draft_description, draft_tags, draft_marquee,
        draft_body,
    )

    dir_changed = new_dir != contexts_dir
    contexts_dir = new_dir
    if dir_changed:
        refresh_contexts()

    if before != after:
        push()


def script_load(settings):
    global contexts_dir, base_url
    contexts_dir = obs.obs_data_get_string(settings, "contexts_dir")
    base_url = obs.obs_data_get_string(settings, "base_url")
    refresh_contexts()

    for name, description in HOTKEYS.items():
        hotkey_id = obs.obs_hotkey_register_frontend(
            name, description, HOTKEY_CALLBACKS[name])
        hotkey_ids[name] = hotkey_id
        saved = obs.obs_data_get_array(settings, name + "_hotkey")
        obs.obs_hotkey_load(hotkey_id, saved)
        obs.obs_data_array_release(saved)


def script_save(settings):
    for name, hotkey_id in hotkey_ids.items():
        saved = obs.obs_hotkey_save(hotkey_id)
        obs.obs_data_set_array(settings, name + "_hotkey", saved)
        obs.obs_data_array_release(saved)
