import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { ROUTES } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const nextPath =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : ROUTES.dashboard;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  return NextResponse.redirect(
    new URL(`${ROUTES.login}?error=confirm`, request.url),
  );
}
