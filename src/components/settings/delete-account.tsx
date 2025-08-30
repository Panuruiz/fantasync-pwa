'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useMutation } from '@tanstack/react-query'
import { deleteAccount } from '@/lib/api/user'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, Shield } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

export function DeleteAccount() {
  const { user } = useUser()
  const [confirmText, setConfirmText] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Account deletion initiated. You will be logged out shortly.')
      // Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })

  const handleDelete = () => {
    if (confirmText !== user?.username) {
      toast.error('Please type your username exactly to confirm')
      return
    }
    
    deleteAccountMutation.mutate()
  }

  const isConfirmValid = confirmText === user?.username

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data.
        </p>
      </div>

      {/* Warning */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Account Deletion</span>
          </CardTitle>
          <CardDescription>
            This action cannot be undone. Please read carefully before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium">What will be deleted:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Your user account and profile</li>
              <li>• All games you've created (other players will be notified)</li>
              <li>• Your characters in all games</li>
              <li>• All messages you've sent</li>
              <li>• Friend connections</li>
              <li>• Personal settings and preferences</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">What will happen to shared content:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Games you created will be transferred to another player or archived</li>
              <li>• Your messages in games will be anonymized</li>
              <li>• Characters will be removed from active games</li>
              <li>• Game masters will be notified of your departure</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Before You Go */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Before You Go</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm">
              If you're having issues with Fantasync, we'd love to help you resolve them instead of 
              losing you as a player. Consider these alternatives:
            </p>
            
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Privacy concerns:</strong> Adjust your privacy settings above</li>
              <li>• <strong>Unwanted notifications:</strong> Turn off notifications in settings</li>
              <li>• <strong>Harassment:</strong> Use our blocking and reporting features</li>
              <li>• <strong>Technical issues:</strong> Contact our support team</li>
            </ul>
            
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
              <Button variant="outline" size="sm">
                Report Issue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Delete Button */}
      <div className="flex justify-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone. All your data will be deleted.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-username">
                  Type your username <strong>"{user?.username}"</strong> to confirm:
                </Label>
                <Input
                  id="confirm-username"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={user?.username}
                  disabled={deleteAccountMutation.isPending}
                />
              </div>
              
              {!isConfirmValid && confirmText && (
                <p className="text-sm text-destructive">
                  Username doesn't match. Please type it exactly.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={deleteAccountMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmValid || deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}