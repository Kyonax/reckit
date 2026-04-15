/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Runtime config — loaded from .env via Vite (VITE_ prefix).
 * Never commit .env — use .env.example as template.
 * Source values from .rc.gpg (gpg --decrypt .rc.gpg).
 */

const DEFAULT_PORT = 4455;

export const OBS_CONFIG = Object.freeze({
  host: import.meta.env.VITE_OBS_WS_HOST || '127.0.0.1',
  port: Number(
    import.meta.env.VITE_OBS_WS_PORT || DEFAULT_PORT,
  ),
  password: import.meta.env.VITE_OBS_WS_PASS || '',
  lan: import.meta.env.VITE_OBS_WS_LAN || '',
});
