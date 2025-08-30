import { type Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password - Fantasync',
  description: 'Reset your Fantasync account password',
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Reset password</h2>
        <p className="text-muted-foreground">
          Enter your email to receive a reset link
        </p>
      </div>
      
      <ResetPasswordForm />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link 
            href="/login" 
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}