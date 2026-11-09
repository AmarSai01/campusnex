// Creates or resets Campusnex logins. Only an active admin may call it.
//
// POST { action: 'create' | 'reset' | 'sync_email', profile_ids: string[] } with the admin's session token.
// sync_email copies a corrected profile email onto the person's existing login.
// Starting password: students = USN + date of birth (DDMMYYYY);
//                    staff    = the part of their email before the @ + date of birth.
// The passwords are returned once so the admin can hand them out; they are never stored.
// On create, the on_auth_user_created trigger links the new login to the profile by email.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MAX_PER_CALL = 200

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const admin = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })

type Profile = {
  id: string; name: string; email: string; role: string; usn: string | null; dob: string | null; status: string; auth_id: string | null
  department_id: string | null; semester: number | null; section: string | null
}

// '2004-08-15' -> '15082004'
const ddmmyyyy = (dob: string) => {
  const [y, m, d] = dob.split('-')
  return `${d}${m}${y}`
}

function startingPassword(p: Profile): string | null {
  if (!p.dob) return null
  if (p.role === 'student') return p.usn ? `${p.usn.trim().toUpperCase()}${ddmmyyyy(p.dob)}` : null
  const local = p.email.split('@')[0]?.trim()
  return local ? `${local}${ddmmyyyy(p.dob)}` : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'Use POST.' })

  // Who is calling? Their session token must belong to an active admin profile.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } })
  if (!who.ok) return reply(401, { error: 'Please sign in again.' })
  const caller = await who.json()
  const callerRows = await (await admin(`/rest/v1/profiles?auth_id=eq.${caller.id}&select=role,status`)).json()
  if (callerRows[0]?.role !== 'admin' || callerRows[0]?.status !== 'active') {
    return reply(403, { error: 'Only an administrator can create or reset logins.' })
  }

  let body: { action?: string; profile_ids?: unknown }
  try {
    body = await req.json()
  } catch {
    return reply(400, { error: 'Invalid request.' })
  }
  const action = body.action
  const ids = Array.isArray(body.profile_ids) ? body.profile_ids.filter((x): x is string => typeof x === 'string') : []
  if (action !== 'create' && action !== 'reset' && action !== 'sync_email') return reply(400, { error: 'Unknown action.' })
  if (!ids.length || ids.length > MAX_PER_CALL) return reply(400, { error: `Choose between 1 and ${MAX_PER_CALL} people.` })

  const list = ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',')
  const profiles: Profile[] = await (
    await admin(`/rest/v1/profiles?id=in.(${encodeURIComponent(list)})&select=id,name,email,role,usn,dob,status,auth_id,department_id,semester,section`)
  ).json()

  const results = []
  for (const p of profiles) {
    const base = {
      id: p.id, name: p.name, email: p.email, role: p.role, usn: p.usn,
      department_id: p.department_id, semester: p.semester, section: p.section,
    }
    if (action === 'sync_email') {
      if (!p.auth_id) {
        results.push({ ...base, ok: true })
        continue
      }
      const r = await admin(`/auth/v1/admin/users/${p.auth_id}`, { method: 'PUT', body: JSON.stringify({ email: p.email, email_confirm: true }) })
      if (r.ok) results.push({ ...base, ok: true })
      else {
        const e = await r.json().catch(() => ({}))
        results.push({ ...base, ok: false, error: e.msg || e.message || 'Could not update the login email' })
      }
      continue
    }
    if (p.status !== 'active') {
      results.push({ ...base, ok: false, error: 'Account is deactivated' })
      continue
    }
    const password = startingPassword(p)
    if (!password) {
      results.push({ ...base, ok: false, error: p.role === 'student' && !p.usn ? 'USN missing' : 'Date of birth missing' })
      continue
    }
    if (action === 'create') {
      if (p.auth_id) {
        results.push({ ...base, ok: false, error: 'Already has a login (use Reset password)' })
        continue
      }
      const r = await admin('/auth/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email: p.email, password, email_confirm: true }),
      })
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        results.push({ ...base, ok: false, error: e.msg || e.message || 'Could not create the login' })
        continue
      }
    } else {
      if (!p.auth_id) {
        results.push({ ...base, ok: false, error: 'No login yet (use Create login)' })
        continue
      }
      const r = await admin(`/auth/v1/admin/users/${p.auth_id}`, { method: 'PUT', body: JSON.stringify({ password }) })
      if (!r.ok) {
        results.push({ ...base, ok: false, error: 'Could not reset the password' })
        continue
      }
    }
    results.push({ ...base, ok: true, password })
  }
  return reply(200, { results })
})
