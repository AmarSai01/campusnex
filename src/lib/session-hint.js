// A visitor with no saved session (and not arriving from an email link) cannot be signed in,
// so the landing page can show at once instead of waiting for the sign-in check.
export const MAY_HAVE_SESSION = (() => {
  try {
    if (/access_token|type=recovery|code=/.test(window.location.hash + window.location.search)) return true
    return Object.keys(window.localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
  } catch {
    return true
  }
})()
