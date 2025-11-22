import { NextResponse } from "next/server";
...
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'github',
})
return NextResponse.redirect(data.url)
