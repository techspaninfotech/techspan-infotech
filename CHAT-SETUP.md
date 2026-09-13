# TechSpan website chat: activation guide

The website widget and `/admin/chat/` inbox are static frontend files. Live chat needs the separate Cloudflare Worker and D1 database described below. GitHub Pages is still the website host. Do not overwrite the working `techspan-admin-auth` Worker.

## 1. Create the NEW chat database

In Cloudflare, open **Storage & databases → D1 SQL database → Create database**. Name it `techspan-chat`. Open that database's **Console** and run the contents of `chat-schema.sql` from this delivery. Run it only in the new chat database, not another application database.

## 2. Create and deploy the chat Worker

Open **Compute → Workers & Pages → Create application → Hello World**. Name the NEW Worker `techspan-chat`. Deploy, open **Edit code**, and replace its Hello World code with the contents of `chat-worker.mjs`. Cloudflare's editor file can remain named `worker.js`; the supplied code is an ES module.

## 3. Bind the database

Open the `techspan-chat` Worker → **Bindings → Add binding → D1 database**. Variable/binding name: **`CHAT_DB`**. Select the **`techspan-chat`** database. Save and deploy the current Worker version. No OAuth secrets are needed in this chat Worker. Authentication uses the existing `techspan-admin-auth` popup, then the chat Worker verifies the GitHub account and issues a short-lived chat-only session.

## 4. Enable retention cleanup (required)

In the chat Worker settings, add a **Cron Trigger** running daily, for example `0 3 * * *` (03:00 UTC). The scheduled handler deletes conversations and their messages after 30 days without a message, and removes expired sessions and rate-limit records. Cleanup only runs when this trigger is configured. Cloudflare recovery backups can have separate retention; consult Cloudflare's D1 settings and policies.

## 5. Verify the public endpoint

Open `https://techspan-chat.techspaninfotech.workers.dev/health`. The expected response is `{"ready":true}`. If the generated hostname differs, update **apiBase** in `chat-config.js` to your actual chat Worker origin. The default matches the account subdomain supplied earlier.

## 6. Test website and admin

1. Open the website and select **Let's chat**.
2. Enter synthetic test details, tick consent, and start a conversation.
3. Send a test message. Never enter passwords or payment information.
4. Open `https://www.techspaninfotech.com/admin/chat/` and select **Login with GitHub** using the `techspaninfotech` account. This is a separate chat session using the same GitHub identity, not a new account.
5. The guest appears in the inbox with details and an unread badge. Select the conversation and reply.
6. Verify the reply appears in the guest widget within about 5 seconds.
7. Test deleting the synthetic chat from either side.

The content dashboard `/admin/` has a floating **Live Chat Inbox** link. After signing into chat in the same tab, its badge refreshes every 15 seconds. In the chat inbox, use **Enable notifications** to request browser notifications. They are generated only while the dashboard is open and polling; no background push or email notification service is included. Initial loading and hidden tabs do not produce continuous polling alerts.

## Security, privacy and operational limits

- Required contact information and consent are validated on the server as well as in the form.
- Guest session tokens are random, stored hashed in D1, and limited to one conversation. Guest browser session storage contains only chat ID/token, not names, email or phone.
- GitHub OAuth tokens are exchanged for chat-only sessions; GitHub tokens are not stored in D1 or session storage by the chat inbox. Admin chat sessions expire in 8 hours and can be revoked by signing out.
- Only the `techspaninfotech` GitHub account can create an admin session. No visitor can read the admin inbox without that authenticated session.
- Messages render as text, not HTML; SQL parameters are bound. Guest-created conversations and messages have basic rate limits. These are not a substitute for a WAF/Turnstile under substantial abuse. Review Cloudflare usage and billing before public launch.
- The inbox displays the 100 most recently active conversations. Message history loads 100 messages per request, with subsequent polling fetching the next batch.
- Guests can delete their own stored chat/details; admins can delete conversations. Deletions are permanent from the active database. Backups may remain subject to provider retention.
- No real guest data or credentials are committed to GitHub. The repository contains source code and schema only.
- Browser notifications can be visible on the OS lock screen. The notification body is generic and does not include email, phone or message text.
- The consent notice must reflect your company's actual privacy policy and enabled cleanup schedule before launch.

## Troubleshooting

- **Chat setup is not complete:** check the `CHAT_DB` binding on the live chat Worker.
- **Chat service temporarily unavailable:** check that the schema ran in the bound database, then inspect Worker logs. The API intentionally does not expose database internals or guest data in errors.
- **Login window remains open:** in the EXISTING auth Worker, ensure `SITE_ORIGIN` is exactly `https://www.techspaninfotech.com`, and use that canonical website URL. GitHub callback remains the existing auth Worker's `/callback` URL.
- **Admin session expired:** sign into the chat inbox again.
- **No notification while dashboard is closed:** expected; background push/email is not part of this version.
- **Reply appears twice after retry:** client IDs prevent duplicate inserts. Do not replace the IDs with timestamps.

