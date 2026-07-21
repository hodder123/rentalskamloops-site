// Vercel serverless function: verifies Google reCAPTCHA v2, then forwards to Web3Forms.
// Requires env var RECAPTCHA_SECRET (set in Vercel project settings).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  // Parse body (urlencoded or JSON)
  let data = req.body;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); }
    catch { data = Object.fromEntries(new URLSearchParams(data)); }
  }
  data = data || {};

  const secret = process.env.RECAPTCHA_SECRET;
  const token = data['g-recaptcha-response'];

  if (!secret) { res.redirect(303, '/form-error.html?e=config'); return; }
  if (!token)  { res.redirect(303, '/form-error.html?e=captcha'); return; }

  // Verify the captcha with Google
  try {
    const v = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: (req.headers['x-forwarded-for'] || '').split(',')[0] || ''
      })
    }).then(r => r.json());
    if (!v.success) { res.redirect(303, '/form-error.html?e=captcha'); return; }
  } catch (e) {
    res.redirect(303, '/form-error.html?e=verify'); return;
  }

  // Forward the rest to Web3Forms for email delivery
  const payload = { ...data };
  delete payload['g-recaptcha-response'];
  delete payload['botcheck'];
  try {
    const w = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());
    if (w.success) { res.redirect(303, '/thank-you.html'); return; }
    res.redirect(303, '/form-error.html?e=send'); return;
  } catch (e) {
    res.redirect(303, '/form-error.html?e=send'); return;
  }
}
