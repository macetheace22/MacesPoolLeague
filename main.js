// Pin the ESM bundle to avoid +esm redirect issues
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.28.0/dist/supabase.esm.js'

// Do NOT commit secrets in source. For quick local testing you can set:
// window.__SUPABASE_URL and window.__SUPABASE_ANON_KEY in the HTML before this module loads.
// In production, put the anon key into your hosting provider's environment variables.
const SUPABASE_URL = window.__SUPABASE_URL || 'https://lzitbxzwhuiaeynmrybq.supabase.co'
const SUPABASE_ANON = window.__SUPABASE_ANON_KEY || 'sb_publishable_P4-bBjxsrSsMGn-Pr_89yA_FqPnOek-'

if (!SUPABASE_ANON) {
  console.error('Supabase anon key not provided. Set window.__SUPABASE_ANON_KEY or use an env-based build.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

async function getUserFromClient() {
  try {
    if (supabase.auth.getUser) {
      const res = await supabase.auth.getUser()
      return res?.data?.user ?? null
    }
    if (supabase.auth.getSession) {
      const res = await supabase.auth.getSession()
      return res?.data?.session?.user ?? null
    }
  } catch (e) {
    console.warn('Error retrieving user from supabase client', e)
  }
  return null
}

async function initAuthUI() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  const userEmail = document.getElementById('userEmail')
  const adminLink = document.getElementById('adminLink')

  async function setUserState(user) {
    if (!user) {
      userEmail.textContent = ''
      loginBtn && (loginBtn.style.display = 'inline-block')
      logoutBtn && (logoutBtn.style.display = 'none')
      return
    }
    userEmail.textContent = user.email || user.user_metadata?.full_name || ''
    loginBtn && (loginBtn.style.display = 'none')
    logoutBtn && (logoutBtn.style.display = 'inline-block')
    try {
      const { data: profile, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!error && profile?.is_admin) adminLink && (adminLink.style.display = 'inline-block')
    } catch (e) {
      console.error('failed checking admin', e)
    }
  }

  loginBtn?.addEventListener('click', async () => {
    try {
      const redirect = location.origin + "/MacesPoolLeague/profile.html"
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect } })
      if (error) console.error('signInWithOAuth error', error)
    } catch (e) {
      console.error('signInWithOAuth thrown', e)
    }
  })

  logoutBtn?.addEventListener('click', async () => {
    try {
      await supabase.auth.signOut()
      location.reload()
    } catch (e) {
      console.error('signOut failed', e)
    }
  })

  const currentUser = await getUserFromClient()
  await setUserState(currentUser)

  if (supabase.auth.onAuthStateChange) {
    supabase.auth.onAuthStateChange((_, session) => setUserState(session?.user ?? null))
  }
}

async function loadStandings() {
  try {
    const { data, error } = await supabase.from('standings').select('*')
    const el = document.getElementById('standings')
    if (error) { el.textContent = 'Failed loading standings.'; console.error(error); return }
    if (!data || data.length === 0) { el.textContent = 'No standings yet.'; return }
    let html = '<table><thead><tr><th>Player</th><th>Matches</th><th>Wins</th><th>Losses</th><th>Points</th></tr></thead><tbody>'
    data.forEach(row => {
      html += `<tr><td>${row.display_name || '—'}</td><td>${row.matches_played||0}</td><td>${row.wins||0}</td><td>${row.losses||0}</td><td>${row.points||0}</td></tr>`
    })
    html += '</tbody></table>'
    el.innerHTML = html
  } catch (e) {
    console.error('loadStandings failed', e)
  }
}

async function loadRecentMatches() {
  try {
    const { data, error } = await supabase.from('matches').select('id,date,player1,player2,score1,score2,winner,verified').order('created_at', { ascending: false }).limit(8)
    const el = document.getElementById('recentMatches')
    if (error) { el.textContent = 'Failed loading matches'; console.error(error); return }
    if (!data || data.length === 0) { el.textContent = 'No matches yet.'; return }
    const userIds = Array.from(new Set(data.flatMap(m => [m.player1, m.player2, m.winner]).filter(Boolean)))
    const { data: profiles } = await supabase.from('profiles').select('id,display_name').in('id', userIds)
    const map = Object.fromEntries((profiles||[]).map(p => [p.id, p.display_name]))
    let html = '<table><thead><tr><th>Date</th><th>Match</th><th>Score</th><th>Verified</th></tr></thead><tbody>'
    data.forEach(m => {
      const p1 = map[m.player1] || m.player1
      const p2 = map[m.player2] || m.player2
      html += `<tr><td>${new Date(m.date).toLocaleString()}</td><td>${p1} vs ${p2}</td><td>${m.score1} — ${m.score2}</td><td>${m.verified? 'Yes':'No'}</td></tr>`
    })
    html += '</tbody></table>'
    el.innerHTML = html
  } catch (e) {
    console.error('loadRecentMatches failed', e)
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuthUI()
  await loadStandings()
  await loadRecentMatches()
})
