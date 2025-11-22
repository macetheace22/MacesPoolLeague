import { NextResponse } from "next/server";
...
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})
return NextResponse.redirect(data.url)
