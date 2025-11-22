import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const SUPABASE_URL = 'https://lzitbxzwhuiaeynmrybq.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aXRieHp3aHVpYWV5bm1yeWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Njg2NjcsImV4cCI6MjA3OTI0NDY2N30.5PNoFntss-iTlU0Jt6DNDV74VG8G406UVF61OLSuQb0'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

async function initAuthUI() {
  const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : (await supabase.auth.getSession()).data?.user;
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  const userEmail = document.getElementById('userEmail')
  const adminLink = document.getElementById('adminLink')

  async function setUserState(user) {
    if (user) {
      userEmail.textContent = user.email || user.user_metadata?.full_name || ''
      loginBtn.style.display = 'none'
      logoutBtn.style.display = 'inline-block'
      // check admin
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single().maybeSingle()
      if (profile && profile.is_admin) {
        adminLink.style.display = 'inline-block'
      }
    } else {
      userEmail.textContent = ''
      loginBtn.style.display = 'inline-block'
      logoutBtn.style.display = 'none'
    }
  }

  // wire buttons
  loginBtn?.addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' }))
  logoutBtn?.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload() })

  // initial
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  await setUserState(currentUser)

  supabase.auth.onAuthStateChange(async (_event, session) => {
    await setUserState(session?.user ?? null)
  })
}



document.getElementById("login-btn").addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/profile.html" }
  });
  if (error) console.error("Login error:", error);
});

import { NextResponse } from "next/server";
...
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})
return NextResponse.redirect(data.url)



async function loadStandings() {
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
}

async function loadRecentMatches() {
  const { data, error } = await supabase.from('matches').select('id,date,player1,player2,score1,score2,winner,verified').order('created_at', { ascending: false }).limit(8)
  const el = document.getElementById('recentMatches')
  if (error) { el.textContent = 'Failed loading matches'; console.error(error); return }
  if (!data || data.length === 0) { el.textContent = 'No matches yet.'; return }
  // fetch display names for players
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
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuthUI()
  await loadStandings()
  await loadRecentMatches()
})
