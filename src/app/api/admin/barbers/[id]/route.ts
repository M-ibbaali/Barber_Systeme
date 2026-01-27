import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const serverSupabase = await createServerClient()
    const { data: { user: adminUser } } = await serverSupabase.auth.getUser()

    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single()

    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, email, password, is_active } = await request.json()

    // 1. Update Profile (name, is_active)
    const { error: profileError } = await serverSupabase
      .from('profiles')
      .update({ 
        ...(name && { name }), 
        ...(typeof is_active === 'boolean' && { is_active }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (profileError) throw profileError

    // 2. Update Auth (email, password)
    const updateData: any = {}
    if (email) updateData.email = email
    if (password) updateData.password = password
    if (name) updateData.user_metadata = { name }

    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData)
      if (authError) throw authError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const serverSupabase = await createServerClient()
    const { data: { user: adminUser } } = await serverSupabase.auth.getUser()

    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single()

    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Delete from Auth (Cascade should handle profiles and incomes)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
