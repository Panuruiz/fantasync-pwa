'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation } from '@tanstack/react-query'
import { exportUserData } from '@/lib/api/user'
import { toast } from 'sonner'
import { Download, FileText, Shield, Info } from 'lucide-react'

export function DataExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportDataMutation = useMutation({
    mutationFn: exportUserData,
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fantasync-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Data export completed successfully!')
      setIsExporting(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export data')
      setIsExporting(false)
    },
  })

  const handleExport = async () => {
    setIsExporting(true)
    exportDataMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Data & Export</h3>
        <p className="text-sm text-muted-foreground">
          Download your data and understand how we handle your information.
        </p>
      </div>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Your Data</span>
          </CardTitle>
          <CardDescription>
            Download a copy of all your data in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span>What's included in your export:</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Profile information and preferences</li>
              <li>• Games you've created or joined</li>
              <li>• Your characters and their data</li>
              <li>• Messages you've sent</li>
              <li>• Friend connections</li>
              <li>• Account settings</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleExport}
            disabled={isExporting || exportDataMutation.isPending}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Preparing Export...' : 'Download My Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Data Policy</span>
          </CardTitle>
          <CardDescription>
            How we handle and protect your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Data Storage</h4>
              <p className="text-sm text-muted-foreground">
                Your data is securely stored using Supabase with encryption at rest and in transit.
                We follow industry best practices for data protection.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Data Retention</h4>
              <p className="text-sm text-muted-foreground">
                We keep your data for as long as your account is active. When you delete your account,
                most data is removed immediately, with some retained for a brief period as required by law.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Data Sharing</h4>
              <p className="text-sm text-muted-foreground">
                We never sell your personal data. Game content may be visible to other players
                in your games according to your privacy settings.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Terms of Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Portability */}
      <Card>
        <CardHeader>
          <CardTitle>Data Portability Rights</CardTitle>
          <CardDescription>
            Your rights under GDPR and other privacy regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Right to Access:</strong> You can request a copy of your personal data at any time
              using the export function above.
            </p>
            <p>
              <strong>Right to Rectification:</strong> You can update your personal information through
              your profile settings.
            </p>
            <p>
              <strong>Right to Erasure:</strong> You can delete your account and associated data through
              the account deletion option.
            </p>
            <p>
              For questions about your data rights, contact us at privacy@fantasync.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}