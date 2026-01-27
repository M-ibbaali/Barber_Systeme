import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based access control and Status check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Block inactive users
    if (profile && !profile.is_active) {
       const loginUrl = new URL("/login", request.url);
       loginUrl.searchParams.set("error", "inactive_account");
       // Sign out the user session if inactive
       await supabase.auth.signOut();
       return NextResponse.redirect(loginUrl);
    }

    if (request.nextUrl.pathname.startsWith("/dashboard/barber")) {
      if (profile?.role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      if (profile?.role !== "barber") {
        // If logged in but role is missing/wrong, don't allow dashboard access
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "invalid_role");
        return NextResponse.redirect(loginUrl);
      }
    }

    if (request.nextUrl.pathname.startsWith("/dashboard/admin")) {
      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard/barber", request.url));
      }
    }
  }

  if (request.nextUrl.pathname === "/login" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    } else if (profile?.role === "barber") {
      return NextResponse.redirect(new URL("/dashboard/barber", request.url));
    }
    // If user is logged in but has NO valid role yet, stay on login
    // This prevents the loop: /login -> /dashboard -> /login
  }

  return supabaseResponse
}
