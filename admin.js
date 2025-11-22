import { supabase } from './main.js'

async function initAdmin() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  const userEmail = document.getElementById('userEmail')

  loginBtn?.addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' , options: { redirectTo: location.origin + "MacesPoolLeague/profile.html" }}))
  logoutBtn?.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload() })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    document.getElementById('pending').innerHTML = '<p>Please sign in as an admin.</p>'
    return
  }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single().maybeSingle()
  if (!profile || !profile.is_admin) {
    document.getElementById('pending').innerHTML = '<p>You are not an admin.</p>'
    return
  }

  loadPending()
  loadPlayers()
}

async function loadPending() {
  const { data, error } = await supabase.from('matches').select('*').eq('verified', false).order('created_at', { ascending: false })
  const el = document.getElementById('pending')
  if (error) { el.textContent = 'Failed to load'; console.error(error); return }
  if (!data || data.length === 0) { el.innerHTML = '<p>No pending matches.</p>'; return }
  // fetch player names
  const uids = Array.from(new Set(data.flatMap(m => [m.player1, m.player2, m.submitted_by])))
  const { data: profiles } = await supabase.from('profiles').select('id,display_name').in('id', uids)
  const map = Object.fromEntries((profiles||[]).map(p => [p.id, p.display_name]))
  let html = '<table><thead><tr><th>When</th><th>Match</th><th>Score</th><th>Submitter</th><th>Actions</th></tr></thead><tbody>'
  data.forEach(m => {
    html += `<tr data-id="${m.id}"><td>${new Date(m.date).toLocaleString()}</td><td>${map[m.player1]||m.player1} vs ${map[m.player2]||m.player2}</td><td>${m.score1} — ${m.score2}</td><td>${map[m.submitted_by]||m.submitted_by}</td><td><button class="verifyBtn">Verify</button> <button class="deleteBtn">Delete</button></td></tr>`
  })
  html += '</tbody></table>'
  el.innerHTML = html

  el.querySelectorAll('.verifyBtn').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const id = ev.target.closest('tr').dataset.id
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('matches').update({ verified: true, verified_by: user.id }).eq('id', id)
      if (error) { alert('Failed to verify'); console.error(error) } else { loadPending(); alert('Verified') }
    })
  })
  el.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const id = ev.target.closest('tr').dataset.id
      if (!confirm('Delete this match?')) return
      const { error } = await supabase.from('matches').delete().eq('id', id)
      if (error) { alert('Failed to delete'); console.error(error) } else { loadPending(); alert('Deleted') }
    })
  })
}

async function loadPlayers() {
  const { data, error } = await supabase.from('profiles').select('*').order('display_name')
  const el = document.getElementById('players')
  if (error) { el.textContent = 'Failed to load players'; console.error(error); return }
  let html = '<table><thead><tr><th>Name</th><th>Username</th><th>Admin</th><th>Actions</th></tr></thead><tbody>'
  data.forEach(p => {
    html += `<tr data-id="${p.id}"><td>${p.display_name||''}</td><td>${p.username||''}</td><td>${p.is_admin? 'Yes':'No'}</td><td><button class="editBtn">Edit</button></td></tr>`
  })
  html += '</tbody></table>'
  el.innerHTML = html

  el.querySelectorAll('.editBtn').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const id = ev.target.closest('tr').dataset.id
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
      const newAdmin = confirm('Toggle admin status for ' + (data.display_name || data.username) + '\n(OK to make admin, Cancel to remove admin)')
      const { error } = await supabase.from('profiles').update({ is_admin: newAdmin }).eq('id', id)
      if (error) { alert('Failed to update'); console.error(error) } else { loadPlayers(); alert('Updated') }
    })
  })
}

document.addEventListener('DOMContentLoaded', initAdmin)
