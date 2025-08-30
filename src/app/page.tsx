import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Fantasync
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The asynchronous role-playing platform for online games. 
              Play when you want, where you want, with your friends.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
            <Card>
              <CardHeader>
                <CardTitle>Asynchronous Play</CardTitle>
                <CardDescription>
                  Play at your own pace without scheduling conflicts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Take your turn when it&apos;s convenient. No need to coordinate schedules with your entire group.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rich Character Sheets</CardTitle>
                <CardDescription>
                  Full D&D 5e character management and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Complete character sheets with automatic calculations, spell tracking, and inventory management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Chat</CardTitle>
                <CardDescription>
                  Immersive communication with dice rolling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Chat with your party, roll dice, and share images all within the same interface.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}