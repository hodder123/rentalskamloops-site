# Setup — forms, reCAPTCHA, and deploy

The site is fully static except for one small serverless function (`/api/submit.mjs`)
that verifies reCAPTCHA and forwards form submissions to Web3Forms. Vercel runs it
automatically — no build config needed.

## 1. Web3Forms (email delivery) — free
1. Sign up at https://web3forms.com and get your **Access Key**.
2. In `contact/index.html` and `application-form/index.html`, replace
   `YOUR_WEB3FORMS_ACCESS_KEY` with it. (Same key works for both.)

## 2. Google reCAPTCHA v2 ("I'm not a robot") — free
1. Go to https://www.google.com/recaptcha/admin/create
2. Choose **reCAPTCHA v2 → "I'm not a robot" Checkbox**.
3. Under Domains, add BOTH your test domain (the `*.vercel.app` URL) and
   `rentalskamloops.ca` (so it works before and after you switch the domain).
4. You get a **Site Key** and a **Secret Key**.
5. **Site Key** → replace `YOUR_RECAPTCHA_SITE_KEY` in `contact/index.html` and
   `application-form/index.html`.
6. **Secret Key** → in Vercel: Project → Settings → Environment Variables → add
   `RECAPTCHA_SECRET` = your secret key → Save → Redeploy.

That's it. The function verifies the reCAPTCHA server-side and only forwards genuine
submissions to Web3Forms, so bots that skip the checkbox are rejected.

## How a submission flows
Visitor fills form → checks reCAPTCHA → POSTs to `/api/submit` → the function verifies
the token with Google → if valid, forwards to Web3Forms → you get the email → visitor
sees `/thank-you.html` (or `/form-error.html` if the check fails).

## Note
Until you set your own Site Key + `RECAPTCHA_SECRET`, the reCAPTCHA box will show an
error and the forms won't send — that's expected. Everything else on the site works
without any keys.
