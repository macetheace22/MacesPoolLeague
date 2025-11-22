import { supabase } from './main.js'

async function init() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  const userEmail = document.getElementById('userEmail')
  const adminLink = document.getElementById('adminLinkMatches')

  loginBtn?.addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' }))
  logoutBtn?.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload() })

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    userEmail.textContent = user.email || ''
    loginBtn.style.display = 'none'
    logoutBtn.style.display = 'inline-block'
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single().maybeSingle()
    if (profile && profile.is_admin) adminLink.style.display = 'inline-block'
  }

  supabase.auth.onAuthStateChange(async (_e, session) => {
    if (session?.user) {
      userEmail.textContent = session.user.email || ''
      loginBtn.style.display = 'none'
      logoutBtn.style.display = 'inline-block'
    } else {
      userEmail.textContent = ''
      loginBtn.style.display = 'inline-block'
      logoutBtn.style.display = 'none'
    }
  })

  await populatePlayers()

  document.getElementById('matchForm').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { document.getElementById('formMsg').textContent = 'Please sign in.'; return }
    const p1 = document.getElementById('player1').value
    const p2 = document.getElementById('player2').value
    const s1 = parseInt(document.getElementById('score1').value || '0', 10)
    const s2 = parseInt(document.getElementById('score2').value || '0', 10)
    if (p1 === p2) { document.getElementById('formMsg').textContent = 'Select two different players.'; return }
    const winner = s1 > s2 ? p1 : s2 > s1 ? p2 : null
    const payload = {
      submitted_by: user.id,
      player1: p1,
      player2: p2,
      score1: s1,
      score2: s2,
      winner,
      verified: false
    }
    const { error } = await supabase.from('matches').insert(payload)
    if (error) { document.getElementById('formMsg').textContent = 'Failed to submit.'; console.error(error) } else { document.getElementById('formMsg').textContent = 'Submitted — awaiting admin verification.'; document.getElementById('matchForm').reset() }
  })
}

async function populatePlayers() {
  const { data } = await supabase.from('profiles').select('id,display_name').order('display_name')
  const p1 = document.getElementById('player1')
  const p2 = document.getElementById('player2')
  p1.innerHTML = ''
  p2.innerHTML = ''
  (data||[]).forEach(u => {
    const opt = `<option value="${u.id}">${u.display_name || u.id}</option>`
    p1.insertAdjacentHTML('beforeend', opt)
    p2.insertAdjacentHTML('beforeend', opt)
  })
}

document.addEventListener('DOMContentLoaded', init)
