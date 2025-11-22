import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient("https://lzitbxzwhuiaeynmrybq.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aXRieHp3aHVpYWV5bm1yeWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Njg2NjcsImV4cCI6MjA3OTI0NDY2N30.5PNoFntss-iTlU0Jt6DNDV74VG8G406UVF61OLSuQb0");

document.getElementById("login-btn").addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/profile.html" }
  });
  if (error) console.error("Login error:", error);
});
