import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/admin/barbers
 * Creates a new barber account. Restricted to Admins only.
 */
export async function POST(request: Request) {
  try {
    // 1. Initialize the standard Server Client (uses user's JWT)
    const supabase = await createServerClient()
    
    // 2. Validate Authentication
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Validate Role (Admin check)
    // We use the Admin Client here to bypass RLS and ensure we get the truth
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required', 
        code: 'not_admin' 
      }, { status: 403 })
    }

    // 4. Parse and Validate Request Body
    const { name, email, password } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 5. Create User in Supabase Auth via Admin API
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'barber' }
    })

    if (createUserError) {
      return NextResponse.json({ 
        error: createUserError.message, 
        code: createUserError.code 
      }, { status: 400 })
    }

    // Note: The 'on_auth_user_created' PostgreSQL trigger in our schema automatically 
    // creates the record in the 'profiles' table using the metadata provided above.

    return NextResponse.json({ 
      success: true, 
      message: 'Barber account created successfully',
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        name: name
      }
    })

  } catch (error: any) {
    console.error('[BARBER_CREATE_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
