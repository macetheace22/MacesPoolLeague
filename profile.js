import { supabase } from './main.js'

async function initAuth() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  const userEmail = document.getElementById('userEmail')
  const adminLink = document.getElementById('adminLinkProfile')

  //loginBtn?.addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' }))
  loginBtn?.addEventListener("click", async () => { const { error } = await supabase.auth.signInWithOAuth({provider: "google", options: { redirectTo: location.origin + "/MacesPoolLeague/profile.html" }});if (error) console.error("Login error:", error);});
  logoutBtn?.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload() })

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    userEmail.textContent = user.email || ''
    loginBtn.style.display = 'none'
    logoutBtn.style.display = 'inline-block'
    // check admin
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single().maybeSingle()
    if (profile && profile.is_admin) adminLink.style.display = 'inline-block'
    loadProfile(user.id)
  } else {
    userEmail.textContent = ''
    loginBtn.style.display = 'inline-block'
    logoutBtn.style.display = 'none'
    document.getElementById('profileArea').innerHTML = '<p>Please sign in to manage your profile.</p>'
  }

  supabase.auth.onAuthStateChange(async (_e, session) => {
    if (session?.user) {
      userEmail.textContent = session.user.email || ''
      loginBtn.style.display = 'none'
      logoutBtn.style.display = 'inline-block'
      loadProfile(session.user.id)
    } else {
      userEmail.textContent = ''
      loginBtn.style.display = 'inline-block'
      logoutBtn.style.display = 'none'
      document.getElementById('profileArea').innerHTML = '<p>Please sign in to manage your profile.</p>'
    }
  })
}

async function loadProfile(uid) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single().maybeSingle()
  const el = document.getElementById('profileArea')
  if (error) { el.innerHTML = '<p class="muted">Failed to load profile.</p>'; console.error(error); return }
  const profile = data || { display_name: '', bio: '', avatar_url: '' }
  el.innerHTML = `
    <form id="profileForm">
      <label>Display name <input id="display_name" value="${(profile.display_name||'')}" /></label>
      <label>Username <input id="username" value="${(profile.username||'')}" /></label>
      <label>Avatar URL <input id="avatar_url" value="${(profile.avatar_url||'')}" /></label>
      <label>Bio <textarea id="bio">${(profile.bio||'')}</textarea></label>
      <div style="margin-top:12px"><button type="submit">Save</button></div>
    </form>
    <div id="saveMsg" class="muted"></div>
  `
  document.getElementById('profileForm').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const payload = {
      id: uid,
      display_name: document.getElementById('display_name').value,
      username: document.getElementById('username').value,
      avatar_url: document.getElementById('avatar_url').value,
      bio: document.getElementById('bio').value,
    }
    // upsert
    const { error } = await supabase.from('profiles').upsert(payload, { returning: 'minimal' })
    const msg = document.getElementById('saveMsg')
    if (error) { msg.textContent = 'Failed to save.'; console.error(error) } else { msg.textContent = 'Saved.' }
  })
}

document.addEventListener('DOMContentLoaded', initAuth)
