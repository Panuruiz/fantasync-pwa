import { type Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Register - Fantasync',
  description: 'Create your Fantasync account',
}

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Create account</h2>
        <p className="text-muted-foreground">
          Join the adventure and start playing
        </p>
      </div>
      
      <RegisterForm />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
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