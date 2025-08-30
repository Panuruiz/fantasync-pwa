import { type Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login - Fantasync',
  description: 'Sign in to your Fantasync account',
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      
      <LoginForm />
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link 
            href="/register" 
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
        <p className="text-sm">
          <Link 
            href="/reset-password" 
            className="text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  )
}