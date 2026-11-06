// Emails the Campusnex owner when a college sends a pilot request from the landing page.
//
// Called by the pilot_requests_notify trigger (see 20261106000200_pilot_request_emails.sql)
// with { id } of the new row. The function trusts only the id: it reads the row itself with
// the service role and sends at most one email per request (notified_at), so calling the
// public URL with made-up data cannot send anything.
//
// Secret needed in Supabase (Edge Functions > Secrets): RESEND_API_KEY.
// Resend's free plan without a verified domain only delivers to the account's own address,
// so NOTIFY_TO must be the email the Resend account was created with.

const NOTIFY_TO = 'campusnex.official@gmail.com'
const FROM = 'Campusnex <onboarding@resend.dev>'
const FRESH_MINUTES = 15

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLANS: Record<string, string> = { pilot: 'Department pilot', institution: 'Whole institution' }

const db = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  })

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function emailHtml(r: Record<string, any>) {
  const phone = esc(r.phone)
  const rows: [string, string][] = [
    ['Plan', esc(PLANS[r.plan] ?? r.plan)],
    ['Name', esc(r.name)],
    ['Role', esc(r.role)],
    ['College', esc(r.college)],
    ['City', esc(r.city)],
    ['Mobile', `<a href="tel:+91${phone}">+91 ${phone}</a> &middot; <a href="https://wa.me/91${phone}">WhatsApp</a>`],
  ]
  if (r.email) rows.push(['Email', `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`])
  if (r.departments) rows.push(['Departments', esc(r.departments)])
  if (r.message) rows.push(['Message', esc(r.message).replace(/\n/g, '<br>')])
  const when = new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a;max-width:560px">
  <h2 style="margin:0 0 4px;font-size:20px">New pilot request</h2>
  <p style="margin:0 0 16px;color:#64748b">${esc(when)} IST, from the Campusnex website</p>
  <table cellpadding="8" style="border-collapse:collapse;width:100%">
    ${rows.map(([k, v]) => `<tr><td style="color:#64748b;width:120px;vertical-align:top;border-top:1px solid #e2e8f0">${k}</td><td style="border-top:1px solid #e2e8f0">${v}</td></tr>`).join('')}
  </table>
  <p style="margin:16px 0 0;color:#64748b;font-size:12px">All requests are in Supabase: Table Editor, pilot_requests.</p>
</div>`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { error: 'POST only' })
  if (!RESEND_API_KEY) return reply(500, { error: 'RESEND_API_KEY is not set' })

  let id: unknown
  try {
    id = (await req.json())?.id
  } catch {
    return reply(400, { error: 'Bad body' })
  }
  if (typeof id !== 'string' || !UUID.test(id)) return reply(400, { error: 'Bad id' })

  // Claim the request: set notified_at only if it is fresh and not yet emailed. One winner.
  const since = new Date(Date.now() - FRESH_MINUTES * 60_000).toISOString()
  const claim = await db(
    `pilot_requests?id=eq.${id}&notified_at=is.null&created_at=gte.${encodeURIComponent(since)}&select=*`,
    { method: 'PATCH', body: JSON.stringify({ notified_at: new Date().toISOString() }) },
  )
  if (!claim.ok) return reply(502, { error: 'Database error', status: claim.status })
  const [row] = await claim.json()
  if (!row) return reply(200, { skipped: true })

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [NOTIFY_TO],
      ...(row.email ? { reply_to: row.email } : {}),
      subject: `New pilot request: ${row.college}, ${row.city}`,
      html: emailHtml(row),
    }),
  })

  if (!sent.ok) {
    // Let a later retry send it.
    await db(`pilot_requests?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ notified_at: null }) })
    return reply(502, { error: 'Email not sent', status: sent.status, detail: await sent.text() })
  }
  return reply(200, { sent: true })
})
