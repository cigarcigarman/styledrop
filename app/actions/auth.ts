'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('[signUp error]', error.message, error.status)
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: '이미 가입된 이메일입니다.' }
    }
    return { error: `회원가입 실패: ${error.message}` }
  }

  return { success: '가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.' }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/dashboard'

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: '이메일 인증이 필요합니다. 받은 편지함을 확인하거나, Supabase에서 이메일 인증을 꺼주세요.' }
    }
    return { error: `로그인 실패: ${error.message}` }
  }

  redirect(redirectTo)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
