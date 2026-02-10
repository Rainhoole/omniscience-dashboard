# Operations: Migration, Rollback, and Security Hardening

This guide documents production-safe upgrade steps for Omniscience, including:

- schema migration with backup
- rollback procedure
- baseline hardening (HTTPS, non-root, rate-limit, fail2ban, 2FA)

---

## 1) Safe migration workflow (recommended)

### 1.1 Pre-check

```bash
npm ci
npm run build
```

### 1.2 Backup critical table(s)

Example for `tasks`:

```sql
create table tasks_backup_YYYYMMDD_HHMMSS as table tasks;
```

### 1.3 Run schema migration

```bash
npm run db:push
```

If migration warns about data-loss on backup tables, **abort first** and verify before removing backups.

### 1.4 Post-migration verification

- API checks: `/api/tasks`, `/api/search`, `/api/feed`, `/api/timeline`
- Login flow (with/without 2FA)
- Dashboard views load and data renders correctly

---

## 2) Status enum migration example (old -> new)

When old statuses (`todo`, `review`, `done`) exist but new schema expects (`draft`, `pending_review`, `approved`), map as:

- `todo -> draft`
- `in_progress -> in_progress`
- `review -> pending_review`
- `done -> approved`

If required, also ensure new columns exist (example):

```sql
alter table tasks add column if not exists objective text;
```

---

## 3) Rollback procedure

A rollback helper script can restore `tasks` data from backup while staying compatible with current schema:

```bash
bash scripts/rollback-omniscience-tasks.sh [backup_table]
```

Default backup table in our latest migration:

```bash
tasks_backup_20260209_170722
```

### Rollback checklist

1. Confirm backup table exists.
2. Run rollback script.
3. Verify status distribution and API health.
4. Restart service if needed.

---

## 4) Production hardening baseline

### 4.1 HTTPS + secure cookie

Set in `.env`:

```env
COOKIE_SECURE=true
```

### 4.2 Run app as non-root

Use a dedicated system user (example: `omniscience`) and systemd service with least privilege.

### 4.3 Login endpoint rate-limit (Nginx)

Apply rate-limit to `/api/auth/login` to reduce brute-force attempts.

### 4.4 fail2ban

Create jail for repeated `401` responses on login endpoint.

### 4.5 Security headers

Recommended headers:

- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

---

## 5) Optional TOTP 2FA

Supported via env flags:

```env
TOTP_ENABLED=true
TOTP_SECRET=<base32-secret>
```

Login becomes 2-step:

1. password
2. 6-digit OTP (Google Authenticator/Authy compatible)

---

## 6) Quick smoke test script (manual)

```bash
curl -I https://<your-domain>/login
curl -s https://<your-domain>/api/tasks
curl -s "https://<your-domain>/api/search?q=test"
```

---

## 7) Notes

- Keep backup tables until post-upgrade verification is complete.
- Never commit real `.env` values or TOTP secrets.
- Prefer small, reversible migrations over one-shot destructive changes.
