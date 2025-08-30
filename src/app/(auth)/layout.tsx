import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - Fantasync',
  description: 'Login or register for Fantasync PWA',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Fantasync</h1>
          <p className="text-muted-foreground mt-2">
            Asynchronous role-playing platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}