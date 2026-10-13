import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_DOMAIN } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // O Supabase devolve erro aqui quando o gatilho de cadastro recusa o e-mail.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=nao_autorizado`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=sem_codigo`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=nao_autorizado`);
  }

  const email = data.user.email?.toLowerCase() ?? "";
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=dominio`);
  }

  return NextResponse.redirect(`${origin}/`);
}
