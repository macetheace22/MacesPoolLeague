import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient("YOUR_URL","YOUR_ANON_KEY");

document.getElementById("login-btn").addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/profile.html" }
  });
  if (error) console.error("Login error:", error);
});
